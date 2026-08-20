"""
Fetch bekendmakingen from the SRU API and write them straight to history JSON files.

This combines the retrieve + export steps of the bekendmakingen-downloader project
into one pass, without the intermediate SQLite database. It is meant for unattended
runs (GitHub Actions) that keep the file of the running month up to date; the
authoritative export for a completed month is still produced from the archive
database, which also contains the manually reviewed corrections.

Only the Python standard library is used.

Fetching is incremental and driven by the data, not by the calendar. Per
municipality the most recent history file is located, and everything from its
last publication date onwards is requested in a single query. When that period
spans a month boundary the result is split and every affected month is written.
A run that has been missing for weeks therefore repairs itself, and the month
that just ended is completed by the first run of the new month. Use --full to
request the whole target month regardless.

A file is rewritten only when its content actually changed. The sort order of a
history file is not portable between platforms, because glibc and the Windows
CRT disagree about spaces and punctuation under the same locale name, so a byte
comparison would rewrite hundreds of unchanged files on every run.

Usage:
    python scripts/fetch_history.py                             # up to and including the current month
    python scripts/fetch_history.py --year 2026 --month 7       # up to and including a specific month
    python scripts/fetch_history.py --municipality Zaanstad     # single municipality (key name)
    python scripts/fetch_history.py --history-dir /tmp/out      # write elsewhere
    python scripts/fetch_history.py --full                      # ignore existing files, refetch the target month
    python scripts/fetch_history.py --dry-run                   # report only, write nothing

Output: one file per municipality per month, in <history-dir>/<year>/, e.g.
history/2026/'s-gravenhage-2026-08.json, in the format {"publications":[...]},
byte-compatible with export_history.py.
"""

import argparse
import calendar
import json
import locale
import math
import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUNICIPALITIES_URL = "https://basgroot.github.io/bekendmakingen/municipalities.json"
SRU_ENDPOINT = "https://repository.overheid.nl/sru"
PAGE_SIZE = 500
MAX_RETRIES = 15
RETRY_DELAY_BASE = 5  # seconds, multiplied by attempt number
REQUEST_TIMEOUT = 60
DATE_SUFFIX = "T00:00:00.000Z"

# Field order of a publication on disk. Rebuilding every record in this order
# keeps the output byte-stable, also for records read back from an existing file.
FIELDS = ("date", "urlDoc", "urlApi", "type", "title", "description", "location")

# Rate limiting. The repository.overheid.nl API uses a token bucket (no
# Retry-After header). Measured empirically: capacity ~115 requests, refill
# ~1 request/second. We mirror it client-side but keep a deliberate safety
# margin: the burst capacity is kept well below the server's so the server
# bucket is never drained to the edge, and the refill is slightly below the
# server's so any buffer slowly recovers. This makes HTTP 429 responses rare;
# the retry mechanism is the fallback, and a 429 also resets the limiter
# (see penalize) so we don't immediately burst again.
RATE_BUCKET_CAPACITY = 50  # tokens (server measured ~115; kept low for headroom)
RATE_REFILL_PER_SEC = 0.85  # tokens/second (server measured ~1.0)


class RateLimiter:
    """Simple token-bucket limiter mirroring the server's rate limit.

    Allows an initial burst up to ``capacity`` and then paces requests at
    ``refill_per_sec`` tokens per second.
    """

    def __init__(self, capacity, refill_per_sec):
        self.capacity = capacity
        self.refill = refill_per_sec
        self.tokens = float(capacity)
        self.last = time.monotonic()

    def acquire(self):
        """Block until a token is available, then consume one."""
        while True:
            now = time.monotonic()
            self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.refill)
            self.last = now
            if self.tokens >= 1:
                self.tokens -= 1
                return
            time.sleep((1 - self.tokens) / self.refill)

    def penalize(self):
        """Back off after a server-side rate-limit hit.

        Drops any accumulated tokens (including those gained during the retry
        sleep) so the next request is paced from scratch instead of bursting.
        """
        self.tokens = 0.0
        self.last = time.monotonic()


# --------------------------------------------------------------------------
# Municipalities
# --------------------------------------------------------------------------


def load_municipalities(source):
    """Load municipalities from a local path or an URL."""
    if source.startswith("http://") or source.startswith("https://"):
        print(f"Loading municipalities from {source}")
        req = Request(source, method="GET")
        with urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            return json.loads(resp.read().decode("utf-8"))
    print(f"Loading municipalities from {source}")
    with open(source, "r", encoding="utf-8") as f:
        return json.load(f)


def get_lookup_name(key, data):
    """Get the name used to query the SRU API."""
    return data["lookupName"] if "lookupName" in data else key


def get_storage_name(key, data):
    """Get the storage name (lowercase, hyphenated) used in the file name."""
    return get_lookup_name(key, data).lower().replace(" ", "-")


# --------------------------------------------------------------------------
# XML parsing (namespace-agnostic; mirrors getType/getDate/... in map.js)
# --------------------------------------------------------------------------


def local_tag(element):
    """Return the tag of an element without its namespace."""
    tag = element.tag
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def find_elements(element, local_name):
    """Find all descendant elements matching local_name (namespace-agnostic)."""
    if element is None:
        return []
    return [child for child in element.iter() if local_tag(child) == local_name]


def find_element(element, local_name):
    """Find first descendant element matching local_name."""
    results = find_elements(element, local_name)
    return results[0] if results else None


def get_elm_text(element, local_name):
    """Extract text from first descendant matching local_name (namespace-agnostic)."""
    if element is None:
        return None
    for child in element.iter():
        if local_tag(child) == local_name and child.text:
            return child.text.strip()
    return None


def convert_rijksdriehoek(x, y):
    """Convert Dutch Rijksdriehoek (RD New) coordinates to WGS84 lat/lng."""
    ref_rd_x = 155000
    ref_rd_y = 463000
    dx = (x - ref_rd_x) * 1e-5
    dy = (y - ref_rd_y) * 1e-5
    sum_n = (
        3235.65389 * dy
        + -32.58297 * dx**2
        + -0.2475 * dy**2
        + -0.84978 * dx**2 * dy
        + -0.0655 * dy**3
        + -0.01709 * dx**2 * dy**2
        + -0.00738 * dx
        + 0.0053 * dx**4
        + -0.00039 * dx**2 * dy**3
        + 0.00033 * dx**4 * dy
        + -0.00012 * dx * dy
    )
    sum_e = (
        5260.52916 * dx
        + 105.94684 * dx * dy
        + 2.45656 * dx * dy**2
        + -0.81885 * dx**3
        + 0.05594 * dx * dy**3
        + -0.05607 * dx**3 * dy
        + 0.01199 * dy
        + -0.00256 * dx**3 * dy**2
        + 0.00128 * dx * dy**4
        + 0.00022 * dy**2
        + -0.00022 * dx**2
        + 0.00026 * dx**5
    )
    lat = 52.15517 + sum_n / 3600
    lng = 5.387206 + sum_e / 3600
    return lat, lng


TYPE_VERKEERSBESLUIT_MAP = {
    "aanwijzen parkeerplaats voor het opladen van elektrische voertuigen": "laadpaal",
    "tijdelijke verkeersmaatregel van kortere duur dan 4 maanden": "tvm",
    "tijdelijke verkeersmaatregel van langere duur dan 4 maanden": "tvm",
    "regelmatig terugkerende tijdelijke verkeersmaatregel": "tvm",
    "plaatsing of verwijdering van verkeerstekens": "verkeersbesluit",
    "aanbrengen van voorzieningen ter regeling van het verkeer (fysieke maatregel)": "verkeersbesluit",
    "maatregel(en) tot wijziging van de inrichting van de weg": "verkeersbesluit",
}

KNOWN_ACTIVITEITEN = [
    "bouwen",
    "slopen",
    "uitweg en inrit",
    "kappen",
    "milieu",
    "natuur",
    "reclame",
    "brandveilig gebruik",
    "ruimtelijke ordening",
]


def get_type(gzd_elm, warnings):
    """Extract activity type from gzd element, matching the JS getType logic."""
    tvb = get_elm_text(gzd_elm, "typeVerkeersbesluit")
    if tvb:
        if tvb in TYPE_VERKEERSBESLUIT_MAP:
            return TYPE_VERKEERSBESLUIT_MAP[tvb]
        warnings.add(f"Unexpected typeVerkeersbesluit: '{tvb}'")

    activiteit = get_elm_text(gzd_elm, "activiteit")
    if activiteit:
        if activiteit in KNOWN_ACTIVITEITEN:
            return activiteit
        warnings.add(f"Unexpected activiteit: '{activiteit}'")

    type_val = get_elm_text(gzd_elm, "type")
    if type_val:
        return type_val.lower()
    return "onbekend"


def get_publication_date(gzd_elm, fallback_date):
    """Extract publication date (YYYY-MM-DD) from gzd element."""
    available = get_elm_text(gzd_elm, "available")
    if available:
        return available[:10]
    datum = get_elm_text(gzd_elm, "datumTijdstipWijzigingWork")
    if datum:
        return datum[:10]
    return fallback_date


def get_title(gzd_elm, type_val):
    """Extract title from gzd element."""
    for name in ("title", "abstract", "alternative"):
        value = get_elm_text(gzd_elm, name)
        if value:
            return value
    return type_val


def get_description(gzd_elm):
    """Extract description from gzd element."""
    for name in ("abstract", "title"):
        value = get_elm_text(gzd_elm, name)
        if value:
            return value
    return "-"


def process_coordinate(coord_list, gebiedsmarkering):
    """Extract coordinates from a gebiedsmarkering element into coord_list."""

    def add_coord(coord):
        if coord not in coord_list:
            coord_list.append(coord)

    def process_line(locatiegebied):
        if locatiegebied.startswith("LINESTRING"):
            coords = locatiegebied.replace("LINESTRING(", "").replace(")", "").split(",")
            for c in coords:
                parts = c.strip().split(" ")
                if len(parts) == 2:
                    add_coord(f"{parts[1]} {parts[0]}")
        else:
            add_coord(locatiegebied.replace(",", " "))

    def process_polygon(locatiegebied):
        if locatiegebied.startswith("POLYGON"):
            cleaned = re.sub(r"^POLYGON\s*", "", locatiegebied)
            cleaned = cleaned.replace("(", "").replace(")", "")
            for c in cleaned.split(","):
                parts = c.strip().split(" ")
                if len(parts) == 2:
                    add_coord(f"{parts[1]} {parts[0]}")
        elif locatiegebied.startswith("LINESTRING"):
            process_line(locatiegebied)
        elif " " in locatiegebied:
            for c in locatiegebied.split(" "):
                add_coord(c.replace(",", " "))
        else:
            add_coord(locatiegebied.replace(",", " "))

    def process_point_legacy(geometrie):
        if geometrie.startswith("POLYGON"):
            cleaned = re.sub(r"^POLYGON\s*", "", geometrie)
            cleaned = cleaned.replace("(", "").replace(")", "")
            for c in cleaned.split(","):
                parts = c.strip().split()
                if len(parts) == 2:
                    lat, lng = convert_rijksdriehoek(float(parts[0]), float(parts[1]))
                    add_coord(f"{lat} {lng}")
        else:
            coords = geometrie.replace("POINT", "").strip().replace("(", "").replace(")", "").split("  ")
            if len(coords) == 2:
                lat, lng = convert_rijksdriehoek(float(coords[0]), float(coords[1]))
                add_coord(f"{lat} {lng}")

    locatiepunt = get_elm_text(gebiedsmarkering, "locatiepunt")
    punt_elm = find_element(gebiedsmarkering, "Punt")
    punt_geometrie = get_elm_text(punt_elm, "geometrie") if punt_elm is not None else None
    locatiegebied = get_elm_text(gebiedsmarkering, "locatiegebied")

    children = list(gebiedsmarkering)
    tag_name = local_tag(children[0]) if children else None

    if tag_name == "Punt" and locatiepunt:
        add_coord(locatiepunt)
    elif tag_name == "Punt" and punt_geometrie:
        process_point_legacy(punt_geometrie)
    elif tag_name == "Adres" and locatiepunt:
        add_coord(locatiepunt)
    elif tag_name in ("Vlak", "Perceel", "Buurt", "Wijk", "GeometrieRef") and locatiegebied:
        process_polygon(locatiegebied)
    elif tag_name in ("Weg", "Lijn") and locatiegebied:
        process_line(locatiegebied)
    elif tag_name in ("Gemeente", "Woonplaats", "Waterschap", "Provincie"):
        pass  # Ignore: too coarse to place on the map


def parse_publications(xml_text, fallback_date, warnings):
    """Parse an SRU XML response. Returns (publications, total, next_record_position)."""
    root = ET.fromstring(xml_text)

    records = find_elements(root, "record")
    if not records:
        return [], 0, None

    number_of_records_elm = find_element(root, "numberOfRecords")
    total = int(number_of_records_elm.text) if number_of_records_elm is not None else 0

    next_pos_elm = find_element(root, "nextRecordPosition")
    next_pos = int(next_pos_elm.text) if next_pos_elm is not None else None

    publications = []
    for record_elm in records:
        try:
            gzd_elm = find_element(record_elm, "gzd")
            if gzd_elm is None:
                continue
            enriched = find_element(gzd_elm, "enrichedData")
            type_val = get_type(gzd_elm, warnings)
            preferred_url = get_elm_text(enriched, "preferredUrl")
            url = get_elm_text(enriched, "url")

            location = []
            for gm in find_elements(gzd_elm, "gebiedsmarkering"):
                process_coordinate(location, gm)

            publications.append(
                {
                    "date": get_publication_date(gzd_elm, fallback_date),
                    "urlDoc": preferred_url or url or "",
                    "urlApi": url or "",
                    "type": type_val,
                    "title": get_title(gzd_elm, type_val),
                    "description": get_description(gzd_elm),
                    "location": location,
                }
            )
        except Exception as e:  # noqa: BLE001 - one bad record must not kill the run
            print(f"  ERROR parsing record: {e}")

    return publications, total, next_pos


# --------------------------------------------------------------------------
# Fetching
# --------------------------------------------------------------------------


def build_url(municipality, start_date, end_date, start_record, page_size):
    """Build the SRU query URL for one page."""
    return (
        f"{SRU_ENDPOINT}?query="
        f"c.product-area==officielepublicaties"
        f"%20AND%20dt.available%3E={start_date}"
        f"%20AND%20dt.available%3C={end_date}"
        f"%20AND%20dt.creator=%22{quote(municipality)}%22"
        f"%20AND%20w.organisatietype%20any%20%22gemeente%20deelgemeente%22"
        f"%20sortBy%20dt.available%20/sort.descending"
        f"&maximumRecords={page_size}&startRecord={start_record}"
        f"&httpAccept=application/xml"
    )


def fetch_publications(municipality, start_date, end_date, limiter, warnings):
    """Fetch publications for one municipality between two dates, inclusive.

    The period may span several months; the caller splits the result. Returns
    (publications, success). On failure success is False and the caller must
    leave any existing file untouched.
    """
    fallback_date = start_date

    all_pubs = []
    start_record = 1
    page_size = PAGE_SIZE
    retries_left = MAX_RETRIES
    attempt = 0

    while True:
        api_url = build_url(municipality, start_date, end_date, start_record, page_size)
        try:
            limiter.acquire()
            req = Request(api_url, method="GET")
            with urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
                status = resp.status
                xml_text = resp.read().decode("utf-8")

            if not xml_text.strip():
                if page_size > 10:
                    new_size = page_size // 2
                    print(f"  {municipality}: empty response with page size {page_size}, reducing to {new_size}")
                    page_size = new_size
                    continue
                raise ValueError(f"Empty response (HTTP {status})")

            if not xml_text.strip().startswith("<"):
                preview = xml_text[:200].replace("\n", " ")
                raise ValueError(f"Non-XML response (HTTP {status}): {preview}")

            pubs, total, next_pos = parse_publications(xml_text, fallback_date, warnings)
            all_pubs.extend(pubs)
            attempt = 0  # Reset on success

            if total > 0 and start_record > 1:
                print(f"  {municipality}: loading {start_record}-{min(start_record + len(pubs) - 1, total)} of {total}")

            if next_pos:
                start_record = next_pos
                retries_left = MAX_RETRIES
            else:
                break

        except Exception as e:  # noqa: BLE001 - every transport error is retried
            if isinstance(e, HTTPError):
                error_msg = f"HTTP {e.code} {e.reason}"
                try:
                    body = e.read().decode("utf-8")[:200].replace("\n", " ")
                    if body:
                        error_msg += f" - {body}"
                except Exception:
                    pass
                is_rate_limited = e.code == 429
            elif isinstance(e, (URLError, TimeoutError, ValueError)):
                error_msg = f"{type(e).__name__}: {e}"
                is_rate_limited = False
            else:
                error_msg = f"{type(e).__name__}: {e}"
                is_rate_limited = False

            if retries_left <= 0:
                print(f"  FAILED: {municipality} after {MAX_RETRIES} attempts. {error_msg}")
                print(f"    URL: {api_url}")
                return [], False

            retries_left -= 1
            attempt += 1
            delay = 10 * attempt if is_rate_limited else RETRY_DELAY_BASE * attempt
            position = f" from record {start_record}" if start_record > 1 else ""
            print(f"  Retrying {municipality}{position} ({retries_left} retries left) in {delay}s.. {error_msg}")
            time.sleep(delay)
            if is_rate_limited:
                limiter.penalize()

    return all_pubs, True


def normalize(pub):
    """Rebuild a publication in the canonical field order, with a plain date."""
    result = {}
    for field in FIELDS:
        value = pub.get(field)
        if field == "date" and isinstance(value, str):
            value = value[:10]
        elif field == "location":
            value = list(value) if value else []
        elif value is None:
            value = ""
        result[field] = value
    return result


def deduplicate(publications):
    """Remove duplicates, mirroring the downloader's two-stage deduplication.

    First on urlDoc+date+title (as fetch_publications does), then on date+urlDoc,
    which is the unique key of the archive database. The first occurrence wins,
    so the result matches what export_history.py produces from that database.
    Freshly fetched records must therefore be passed before existing ones.
    """
    seen_full = set()
    stage_one = []
    for pub in publications:
        key = f"{pub['urlDoc']}|{pub['date']}|{pub['title']}"
        if key not in seen_full:
            seen_full.add(key)
            stage_one.append(pub)

    seen_key = set()
    result = []
    for pub in stage_one:
        key = f"{pub['date']}|{pub['urlDoc']}"
        if key not in seen_key:
            seen_key.add(key)
            result.append(pub)
    return result


# --------------------------------------------------------------------------
# Writing
# --------------------------------------------------------------------------


def sort_key(pub):
    """Sort by date, then by lowercase(title)+urlDoc using Dutch locale.

    Note that the resulting order is not portable: glibc ignores spaces and
    punctuation at the primary collation level while the Windows CRT does not,
    so the same locale name yields a different order on Linux than on Windows.
    That is why a file is rewritten only when its content changed (see
    signature), not when merely its order would differ.
    """
    return (pub["date"], locale.strxfrm(pub["title"].lower() + pub["urlDoc"]))


def signature(publications):
    """Order-independent fingerprint of a set of publications.

    Used to decide whether a file has to be rewritten. Comparing rendered bytes
    would also flag a pure reordering, which happens whenever this script runs on
    a different platform than the one that produced the file.
    """
    return sorted(json.dumps(pub, ensure_ascii=False, sort_keys=True, separators=(",", ":")) for pub in publications)


def render(publications):
    """Render publications in the exact on-disk history format."""
    if not publications:
        return '{"publications":[\n]}'
    content = '{"publications":['
    for i, pub in enumerate(publications):
        content += ("\n" if i == 0 else ",\n") + json.dumps(pub, ensure_ascii=False, separators=(",", ":"))
    return content + "\n]}"


def history_path(history_dir, storage_name, year, month):
    """Path of the history file of one municipality for one month."""
    return os.path.join(history_dir, str(year), f"{storage_name}-{year}-{month:02d}.json")


def add_months(year, month, delta):
    """Return (year, month) shifted by delta months."""
    index = year * 12 + (month - 1) + delta
    return index // 12, index % 12 + 1


def months_between(start, end):
    """Yield every (year, month) from start up to and including end."""
    current = start
    while current <= end:
        yield current
        current = add_months(current[0], current[1], 1)


def load_existing(filepath):
    """Read an existing history file.

    Returns (content, publications). Both are None when the file does not exist;
    publications is None when the file cannot be parsed, which makes the caller
    treat the month as unknown.
    """
    try:
        with open(filepath, "r", encoding="utf-8", newline="") as f:
            content = f.read()
    except FileNotFoundError:
        return None, None
    try:
        return content, [normalize(pub) for pub in json.loads(content)["publications"]]
    except Exception:  # noqa: BLE001 - a corrupt file must not stop the run
        print(f"  WARNING: could not parse {os.path.basename(filepath)}, treating the month as unknown")
        return content, None


def find_resume(history_dir, storage_name, target, lookback_months, overlap_days):
    """Find the date to resume from, based on the most recent file on disk.

    Walks back from the target month until a file with publications is found,
    at most lookback_months. Returns (start_date, source) where start_date is
    None when nothing usable was found and the whole target month must be
    fetched. The last known day is always requested again (minus the overlap),
    because that day may have been captured halfway through.
    """
    for offset in range(0, lookback_months + 1):
        year, month = add_months(target[0], target[1], -offset)
        _, publications = load_existing(history_path(history_dir, storage_name, year, month))
        if not publications:
            continue
        try:
            latest = date.fromisoformat(max(pub["date"] for pub in publications))
        except ValueError:
            continue
        start = latest - timedelta(days=overlap_days)
        # Never skip past today: a future-dated publication must not move the
        # window beyond the current day.
        today = date.today()
        if today <= date(target[0], target[1], calendar.monthrange(*target)[1]):
            start = min(start, today - timedelta(days=overlap_days))
        first_of_target = date(target[0], target[1], 1)
        if start <= first_of_target and (year, month) == target:
            return None, f"{year}-{month:02d}"
        return start.isoformat(), f"{year}-{month:02d}"
    return None, None


def setup_locale(require):
    """Activate Dutch collation, so the sort order matches the existing files."""
    for name in ("nl_NL.UTF-8", "nl_NL.utf8", "Dutch_Netherlands.1252"):
        try:
            locale.setlocale(locale.LC_COLLATE, name)
            print(f"Collation: {name}")
            return True
        except locale.Error:
            continue
    message = (
        "Dutch locale not available. The sort order will differ from the existing "
        "history files, which produces spurious full-file diffs. On Ubuntu: "
        "sudo locale-gen nl_NL.UTF-8"
    )
    if require:
        print(f"ERROR: {message}")
        return False
    print(f"WARNING: {message}")
    return True


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------


def process(args, municipalities, limiter):
    """Fetch every municipality up to and including the target month.

    Returns (written, unchanged, skipped, failed), counted per file.
    """
    target = (args.year, args.month)
    last_day = calendar.monthrange(*target)[1]
    end_date = f"{args.year}-{args.month:02d}-{last_day}"

    if args.municipality:
        if args.municipality not in municipalities:
            print(f"ERROR: unknown municipality '{args.municipality}'")
            return [], [], [], [args.municipality]
        keys = [args.municipality]
    else:
        keys = list(municipalities.keys())

    # Group by storage name: merged municipalities can map several source names
    # onto one file when the requested year predates the merger.
    targets = {}
    for key in keys:
        data = municipalities[key]
        storage_name = get_storage_name(key, data)
        if "origin" in data and args.year < data["origin"]["year"]:
            sources = list(data["origin"]["municipalities"])
        else:
            sources = [get_lookup_name(key, data)]
        targets.setdefault(storage_name, []).extend(sources)

    written = []
    unchanged = []
    skipped = []
    failed = []
    warnings = set()

    total = len(targets)
    for index, storage_name in enumerate(sorted(targets), start=1):
        sources = targets[storage_name]

        # Resume from the most recent publication on disk, in whichever month
        # that turns out to be. Only when nothing is found is the whole target
        # month requested.
        if args.full:
            start_date, source_month = None, None
        else:
            start_date, source_month = find_resume(
                args.history_dir, storage_name, target, args.lookback_months, args.overlap_days
            )
        if start_date is None:
            start_date = f"{args.year}-{args.month:02d}-01"
            period = "whole target month"
        else:
            period = f"from {start_date}" + (f" (last seen in {source_month})" if source_month else "")

        publications = []
        ok = True
        for source in sources:
            pubs, success = fetch_publications(source, start_date, end_date, limiter, warnings)
            if not success:
                ok = False
                break
            publications.extend(pubs)

        if not ok:
            failed.append(storage_name)
            print(f"[{index}/{total}] {storage_name}: FAILED, existing files left untouched")
            continue

        # Split the result over the months it covers and write each of them.
        fetched = {}
        for pub in publications:
            fetched.setdefault(pub["date"][:7], []).append(pub)

        first_month = (int(start_date[:4]), int(start_date[5:7]))
        results = []
        for year, month in months_between(first_month, target):
            month_str = f"{year}-{month:02d}"
            filepath = history_path(args.history_dir, storage_name, year, month)
            existing_content, existing_pubs = load_existing(filepath)
            fresh = fetched.get(month_str, [])

            # A month that is only partially covered may only be written when its
            # existing content is known, otherwise the untouched days would be
            # dropped. The first month is partial unless the window starts on the 1st.
            is_partial = (year, month) == first_month and int(start_date[8:10]) > 1
            if is_partial and existing_pubs is None:
                if fresh:
                    skipped.append(f"{storage_name} {month_str}")
                    print(
                        f"[{index}/{total}] {storage_name} {month_str}: SKIPPED, "
                        f"{len(fresh)} records fetched but the existing file is missing or unreadable"
                    )
                continue

            merged = deduplicate([normalize(pub) for pub in fresh + (existing_pubs or [])])
            # Compare content before the date suffix and the sort are applied, so
            # the comparison is independent of the collation of this machine.
            merged_signature = signature(merged)
            existing_signature = None if existing_pubs is None else signature(existing_pubs)
            for pub in merged:
                pub["date"] = pub["date"] + DATE_SUFFIX
            merged.sort(key=sort_key)
            content = render(merged)
            results.append(
                (month_str, filepath, content, merged, existing_content, existing_pubs, merged_signature, existing_signature, len(fresh))
            )

        for (
            month_str,
            filepath,
            content,
            merged,
            existing_content,
            existing_pubs,
            merged_signature,
            existing_signature,
            fresh_count,
        ) in results:
            label = f"[{index}/{total}] {storage_name} {month_str}"
            detail = f"{len(merged)} records ({fresh_count} fetched, {period})"

            if merged_signature == existing_signature:
                unchanged.append(f"{storage_name} {month_str}")
                # The bytes may still differ when the file was written on a platform
                # with a different collation. Rewriting it would be pure churn.
                suffix = " (sort order differs)" if existing_content != content else ""
                print(f"{label}: {detail}, unchanged{suffix}")
                continue

            if existing_pubs is not None and not args.allow_shrink and len(merged) < len(existing_pubs):
                skipped.append(f"{storage_name} {month_str}")
                print(
                    f"{label}: SKIPPED, would drop from {len(existing_pubs)} to "
                    f"{len(merged)} records (use --allow-shrink to override)"
                )
                continue

            if args.dry_run:
                written.append(f"{storage_name} {month_str}")
                print(f"{label}: {detail}, would write (dry run)")
                continue

            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, "w", encoding="utf-8", newline="\n") as f:
                f.write(content)
            written.append(f"{storage_name} {month_str}")
            print(f"{label}: {detail}, written")

    for warning in sorted(warnings):
        print(f"WARNING: {warning}")

    return written, unchanged, skipped, failed


def main():
    parser = argparse.ArgumentParser(description="Fetch bekendmakingen from the SRU API into history JSON files")
    now = datetime.now()
    parser.add_argument("--year", type=int, default=now.year, help="Target year (default: current)")
    parser.add_argument("--month", type=int, default=now.month, help="Target month (default: current)")
    parser.add_argument("--municipality", type=str, default=None, help="Fetch a single municipality (key name)")
    parser.add_argument(
        "--history-dir",
        type=str,
        default=None,
        help="History root, with a subdirectory per year (default: the history directory of this repository)",
    )
    parser.add_argument(
        "--municipalities",
        type=str,
        default=None,
        help=f"Path or URL of municipalities.json (default: the local file, else {MUNICIPALITIES_URL})",
    )
    parser.add_argument("--dry-run", action="store_true", help="Report what would change, write nothing")
    parser.add_argument("--full", action="store_true", help="Request the whole target month, ignoring existing files")
    parser.add_argument(
        "--overlap-days",
        type=int,
        default=1,
        help="Days before the most recent known publication to request again (default: 1)",
    )
    parser.add_argument(
        "--lookback-months",
        type=int,
        default=2,
        help="Months before the target month to search for the most recent file (default: 2)",
    )
    parser.add_argument("--allow-shrink", action="store_true", help="Allow overwriting a file with fewer records")
    parser.add_argument("--require-locale", action="store_true", help="Fail when Dutch collation is unavailable")
    parser.add_argument(
        "--max-failures",
        type=int,
        default=0,
        help="Exit code 1 when more municipalities than this fail (default: 0)",
    )
    args = parser.parse_args()

    if not 1 <= args.month <= 12:
        print(f"ERROR: month must be 1-12, got {args.month}")
        return 2
    if args.overlap_days < 0:
        print(f"ERROR: --overlap-days must be 0 or higher, got {args.overlap_days}")
        return 2
    if args.lookback_months < 0:
        print(f"ERROR: --lookback-months must be 0 or higher, got {args.lookback_months}")
        return 2

    if args.history_dir is None:
        args.history_dir = os.path.join(REPO_ROOT, "history")
    if args.municipalities is None:
        local = os.path.join(REPO_ROOT, "municipalities.json")
        args.municipalities = local if os.path.exists(local) else MUNICIPALITIES_URL

    if not setup_locale(args.require_locale):
        return 2

    municipalities = load_municipalities(args.municipalities)
    limiter = RateLimiter(RATE_BUCKET_CAPACITY, RATE_REFILL_PER_SEC)

    started = time.monotonic()
    print(
        f"Target {args.year}-{args.month:02d} for {len(municipalities)} municipalities in {args.history_dir}, "
        f"resuming per municipality from its most recent file\n"
    )
    written, unchanged, skipped, failed = process(args, municipalities, limiter)
    elapsed = math.floor(time.monotonic() - started)

    print(f"\nDone in {elapsed // 60}m {elapsed % 60}s.")
    print(f"  Written:   {len(written)} file(s){' (dry run)' if args.dry_run else ''}")
    print(f"  Unchanged: {len(unchanged)}")
    print(f"  Skipped:   {len(skipped)}")
    print(f"  Failed:    {len(failed)}")

    if skipped:
        print("\n  SKIPPED:")
        for name in skipped:
            print(f"    - {name}")
    if failed:
        print(f"\n  FAILED ({len(failed)}):")
        for name in failed:
            print(f"    - {name}")

    if len(failed) > args.max_failures:
        print(f"\nERROR: {len(failed)} municipalities failed, which exceeds --max-failures {args.max_failures}.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
