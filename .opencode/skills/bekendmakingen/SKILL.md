---
name: bekendmakingen
description: Architecture, data sources, and key logic of the bekendmakingen repo (bouwmelding.nl) — covers the SRU 2.0 API, municipalities.json structure and CBS verification, history file format, bezwaartermijn calculation, and icon classification.
---

# bekendmakingen (bouwmelding.nl)

This skill describes the architecture, data sources, and key logic of the `bekendmakingen` repository, which powers [bouwmelding.nl](https://bouwmelding.nl/) — an interactive map showing official Dutch government publications (vergunningen, meldingen, besluiten) per gemeente.

---

## Project overview

- **Single-page app**: pure HTML + JS (`map.js`) + CSS (`map.css`), no framework.
- **Runtime dependencies**: Google Maps JavaScript API (loaded at runtime via API key in `index.html`).
- **Build**: `npm run build` runs terser → cleancss to produce `map.min.js` and `map.min.css`. Prettier and ESLint run via the pre-commit hook, not the build script.
- **Hosting**: static files; history data served from CDN.

---

## SRU 2.0 API (`manual/`)

The `manual/` directory contains the official API documentation:

| File                           | Version | Notes                                      |
| ------------------------------ | ------- | ------------------------------------------ |
| `Handleiding SRU 2.0 v1.2.pdf` | v1.2    | Earliest included version                  |
| `Handleiding SRU 2.0 v1.3.pdf` | v1.3    |                                            |
| `Handleiding SRU 2.0 v1.4.pdf` | v1.4    | Current / most recent                      |
| `example-amsterdam.json`       | —       | Sample raw SRU JSON response for Amsterdam |

### Base endpoint

```
https://repository.overheid.nl/sru
```

### Live query construction (`loadDataForMunicipality` in `map.js`)

```
https://repository.overheid.nl/sru
  ?query=c.product-area==officielepublicaties
         AND dt.available>={startDate}
         AND dt.creator="{gemeentenaam}"
         sortBy dt.available /sort.descending
  &maximumRecords=500
  &startRecord={n}
  &httpAccept=application/json
```

- `dt.creator` is the municipality name as used by the API (see `lookupName` in `municipalities.json`).
- The live query has no end-date clause — it always requests everything from `{startDate}` onward (`startDate` is ~6 weeks back, or the 1st of the current month when last month's history file exists). A `dt.available<=` clause only appears in a commented example URL, not in the constructed query.
- Pagination: each page returns `nextRecordPosition`; the code follows it (`maximumRecords=500`, so effectively +500 per page) until the field is absent, fetching and merging all pages.
- Retries: up to `MAX_RETRIES` (= 7) attempts with **linear** back-off — `attemptNumber * 5` seconds (5 s, 10 s, 15 s, …), in `loadDataWithRetries`.

### XML detail endpoint (for bezwaartermijn)

Each publication has a `urlApi` field pointing to the full XML record. `getUrlApi` builds it from the licence ID; the first segment is the blad type (`gmb`, `prb`, `wsb`, `stcrt`):

```
https://repository.overheid.nl/frbr/officielepublicaties/{type}/{year}/{licenseId}/1/xml/{licenseId}.xml
e.g. https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-56454/1/xml/gmb-2023-56454.xml
```

This XML is fetched on demand when a user clicks a marker, to extract the bezwaartermijn. When the URL is not a recognised `zoek.officielebekendmakingen.nl` link, `urlApi` is `"UNAVAILABLE"` and no detail is fetched.

### Key SRU response fields (JSON)

The raw JSON record is nested under `recordData.gzd.originalData`:

- `meta.owmskern.type` — generic publication type string (or array; first element is used). Fallback type source.
- `meta.tpmeta.activiteit.$` — specific activity type (`bouwen`, `slopen`, `kappen`, `milieu`, etc.).
- `meta.tpmeta.typeVerkeersbesluit` — when present, classified first (→ `laadpaal` / `tvm` / `verkeersbesluit`).
- `meta.owmsmantel.available` — ISO date string; the primary **publication date** used by `getDate` and for sorting. Falls back to `meta.tpmeta.datumTijdstipWijzigingWork`, then today.
- `meta.owmskern.title` — title (falls back to `meta.owmsmantel.abstract`); `abstract` is the description (falls back to title).
- `recordData.gzd.enrichedData.preferredUrl` — the publication's `urlDoc`; the licence ID (e.g. `gmb-2023-56454`) is derived from it via `getLicenseIdFromUrl`, not from `owmskern.identifier`.
- Geographic data: `meta.tpmeta.gebiedsmarkering` (Punt/Adres/Vlak/Perceel/Weg/Lijn/…); RD (Rijksdriehoek) coordinates are converted to WGS84 lat/lng in `map.js`.

---

## `municipalities.json`

Located at the repository root. Contains **342 municipalities** (matching the CBS count for 1 January 2026).

### Structure

```json
{
  "Amsterdam": {
    "center": { "lat": 52.37208, "lng": 4.89921 },
    "origin": {
      "year": 2022,
      "municipalities": ["Amsterdam", "Weesp"]
    }
  },
  "Den Haag": {
    "center": { "lat": 52.07667, "lng": 4.29861 },
    "lookupName": "'s-Gravenhage"
  }
}
```

| Field        | Required | Description                                                                                                                                                                         |
| ------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `center.lat` | yes      | WGS84 latitude of municipality centre                                                                                                                                               |
| `center.lng` | yes      | WGS84 longitude of municipality centre                                                                                                                                              |
| `url`        | no       | Official website of the municipality (e.g. `"https://www.amsterdam.nl"`). Present on most entries.                                                                                  |
| `origin`     | no       | Present when the municipality was formed by a merger after the baseline year (2017). Contains `year` (year of merger) and `municipalities` (array of predecessor names).            |
| `lookupName` | no       | If present, this name is sent to the SRU API instead of the key. Used for municipalities whose official API name differs from the display name (e.g. `Den Haag` → `'s-Gravenhage`). |

### Notable `lookupName` mappings

| Key (display name)     | lookupName (API / slug) |
| ---------------------- | ----------------------- |
| Den Haag               | 's-Gravenhage           |
| Den Bosch              | 's-Hertogenbosch        |
| Bergen (Limburg)       | Bergen                  |
| Bergen (Noord-Holland) | Bergen NH               |

### Verifying against CBS

The municipality list is validated against the CBS (Centraal Bureau voor de Statistiek) annual classifications:

- **Baseline**: https://www.cbs.nl/nl-nl/onze-diensten/methoden/classificaties/overig/gemeentelijke-indelingen-per-jaar/indeling-per-jaar/gemeentelijke-indeling-op-1-januari-2017
- **Current (2026)**: https://www.cbs.nl/nl-nl/onze-diensten/methoden/classificaties/overig/gemeentelijke-indelingen-per-jaar/indeling-per-jaar/gemeentelijke-indeling-op-1-januari-2026 — 342 municipalities, unchanged from 2025.
- Excel download: `Gemeenten alfabetisch {year}.xlsx` linked on each CBS page.
- URL pattern: `.../gemeentelijke-indeling-op-1-januari-{year}` — replace `{year}` for other years.

**When a municipality reorganisation occurs**: add the new municipality with an `origin` field listing predecessor names and the year of merger. Pre-2017 mergers are included if the municipality still exists today.

---

## `history/` — cached publication data

Pre-fetched and cached SRU data for the period **2014–2026**, served as static JSON from CDN for historical period queries (avoiding live API calls for past months).

### Directory layout

```
history/
  2014/
  2015/
  ...
  2026/
    amsterdam-2026-01.json
    amsterdam-2026-02.json
    ...
    rotterdam-2026-01.json
```

### File naming

`<gemeente-slug>-<YYYY>-<MM>.json`

**Slug derivation**: lowercase the municipality key from `municipalities.json`, replace spaces with hyphens, normalise special characters. Examples:

- `Amsterdam` → `amsterdam`
- `'s-Gravenhage` → `'s-gravenhage`
- `IJsselstein` → `ijsselstein`

If a `lookupName` is present in `municipalities.json`, the slug is derived from `lookupName` instead of the key.

### File format

```json
{
  "publications": [
    {
      "date": "2017-01-02T00:00:00.000Z",
      "urlDoc": "https://zoek.officielebekendmakingen.nl/gmb-2017-1152.html",
      "urlApi": "https://repository.overheid.nl/frbr/officielepublicaties/gmb/2017/gmb-2017-1152/1/xml/gmb-2017-1152.xml",
      "type": "Overige besluiten van algemene strekking",
      "title": "Verleende omgevingsvergunning ...",
      "description": "Verleende omgevingsvergunning ...",
      "location": ["52.379 4.799"]
    }
  ]
}
```

| Field         | Type                        | Description                                                                                                                 |
| ------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `date`        | string (ISO 8601)           | Publication date                                                                                                            |
| `urlDoc`      | string                      | Human-readable page on officielebekendmakingen.nl                                                                           |
| `urlApi`      | string (or `"UNAVAILABLE"`) | XML endpoint on repository.overheid.nl; `"UNAVAILABLE"` when no XML exists (e.g. PDF-only publications)                     |
| `type`        | string                      | Publication category, e.g. `Vergunningen`, `Verkeersbesluiten`, `Verordeningen`, `Overige besluiten van algemene strekking` |
| `title`       | string                      | Title of the publication                                                                                                    |
| `description` | string                      | Description (often identical to `title`)                                                                                    |
| `location`    | array of strings            | Zero or more `"lat lng"` strings in WGS84; empty array when no location available                                           |

---

## Icon / type classification (`map.js`)

### Step 1 — `getType()`

Extracts a canonical type string from the raw SRU record, in this order:

1. If `meta.tpmeta.typeVerkeersbesluit` is present, map it to:
   - `laadpaal` — "aanwijzen parkeerplaats voor het opladen van elektrische voertuigen"
   - `tvm` — the three "tijdelijke verkeersmaatregel" / "regelmatig terugkerende" variants
   - `verkeersbesluit` — plaatsing/verwijdering verkeerstekens, fysieke maatregelen, wijziging inrichting weg
2. Else checks `meta.tpmeta.activiteit.$` for a specific activity:
   - `bouwen`, `slopen`, `uitweg en inrit`, `kappen`, `milieu`, `natuur`, `reclame`, `brandveilig gebruik`, `ruimtelijke ordening`
3. Falls back to `meta.owmskern.type` (free-text string from the API, lower-cased).
4. Falls back to `"onbekend"`.

### Step 2 — `getIconName(title, type)`

Maps type + title keywords to an icon name:

| Icon           | Condition                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `aanvraag`     | Title contains `aanvraag` or `verlenging`                                                      |
| `bar`          | Type `brandveilig gebruik`, or title contains `exploitatievergunning` / `alcoholwetvergunning` |
| `evenement`    | Title contains `evenement` or `loterij`                                                        |
| `hotel`        | Title contains `bed & breakfast` or `vakantieverhuur`                                          |
| `boomkap`      | Type `kappen`, or title contains `houtopstand` / `(kap)`                                       |
| `laadpaal`     | Type `laadpaal`, or title contains `oplaadplaats` / `opladen` / `laadpaal`                     |
| `tvm`          | Type `tvm`, or title contains `apv vergunning` / `parkeervakken` / `tvm`                       |
| `verkeer`      | Type `verkeersbesluit` or `uitweg en inrit`                                                    |
| `kamerverhuur` | Title contains `onttrekkingsvergunning` / `omzettingsvergunning`                               |
| `boot`         | Title contains `water`                                                                         |
| `reclame`      | Type `reclame`                                                                                 |
| `milieu`       | Type `milieu` or `natuur`                                                                      |
| `constructie`  | Type `bouwen` or `slopen`                                                                      |
| `wetboek`      | Fallback (meldingen, verordeningen, overige besluiten)                                         |

Icons are SVG files in `img/`.

---

## Bezwaartermijn (objection period)

When a user clicks a marker, `collectBezwaartermijn()` fetches the full XML of the publication and passes it to `parseBekendmaking()` to determine whether and how long a formal objection (_bezwaar_) is still possible.

### Legal basis

Dutch law grants **6 weeks** from the date the decision was sent (_verzenddatum_ / _bekendgemaakt aan belanghebbende_) to file an objection. `maxLooptijd = 6 * 7 + 1` days.

### Date extraction from XML (`getDateFromText()`)

The free-text body of the XML publication is parsed with string matching to find the relevant date. Three patterns are recognised:

#### 1. Standard: date of dispatch (`verzenddatum`)

Text in the publication starts with a known prefix such as `"verzonden op"`, `"verzonden:"`, etc.

The extracted date is used directly; days elapsed since that date are subtracted from `maxLooptijd`.

#### 2. Objection start date (`identifiersStartWithObjectionStart`)

Gouda states the date the objection period _starts_ rather than the dispatch date:

- `"de termijn voor het indienen van een bezwaar start op "`

The extracted date is the start of the objection period; one day is subtracted to derive the dispatch date (`result.date.setDate(...- 1)`).

> Note: the similar Aalsmeer phrasing `"de termijn voor het indienen van een bezwaarschrift start op "` is instead matched as a mid-text marker in `identifiersMiddle`, and its date is used directly **without** the −1 day adjustment.

#### 3. Deadline date (`identifiersWithDeadline`)

Some municipalities (e.g. Alkmaar, Heemstede, Dijk en Waard) state the _last_ date to object:

- `"uw bezwaarschrift moet vóór "`
- `"u kunt het college van de gemeente heemstede tot en met "`
- `"u kunt de gemeente tot "`

The extracted date is the deadline; 6 weeks (42 days) are subtracted to derive the dispatch date (`result.date.setDate(...- 7 * 6)`).

### Output displayed in the info window

- If a bezwaartermijn is found:
  - Publication date (from SRU)
  - Bekendgemaakt date (from XML body)
  - **"Resterend aantal dagen voor bezwaar: N."** (if N > 0) or **"Geen bezwaar meer mogelijk."**
- If no bezwaartermijn can be determined: only the publication date is shown.

---

## URL parameters (permalinks)

| Parameter  | Values                              | Effect                                              |
| ---------- | ----------------------------------- | --------------------------------------------------- |
| `?in=`     | gemeente name                       | Pre-selects a municipality                          |
| `?period=` | `3d`, `7d`, `14d`, `all`, `YYYY-MM` | Pre-selects a time period                           |
| `?zoom=`   | number                              | Sets map zoom level                                 |
| `?center=` | `lat,lng`                           | Sets map centre                                     |
| `?pub=`    | licence ID (e.g. `gmb-2023-56454`)  | Opens the info window for that publication directly |

---

## Coordinate systems

Raw location data from the SRU API sometimes uses **RD New** (Rijksdriehoekstelsel, EPSG:28992). `map.js` contains a conversion function to transform RD coordinates to WGS84 (lat/lng) for Google Maps.

History files always store coordinates in WGS84 (`"lat lng"` string format).

---

## Key files reference

| File                            | Purpose                                                  |
| ------------------------------- | -------------------------------------------------------- |
| `map.js`                        | All application logic (single large monolithic file)     |
| `map.min.js`                    | Minified build output (do not edit)                      |
| `map.css`                       | Styles                                                   |
| `map.min.css`                   | Minified build output (do not edit)                      |
| `index.html`                    | Entry point, Google Maps API key, PWA meta               |
| `municipalities.json`           | Municipality list with coordinates and merger history    |
| `periods.json`                  | Time period filter options (rolling + monthly 2014–2026) |
| `history/<year>/*.json`         | Cached monthly publication data per municipality         |
| `manual/*.pdf`                  | SRU 2.0 API documentation (v1.2, v1.3, v1.4)             |
| `manual/example-amsterdam.json` | Sample raw SRU API JSON response                         |
| `.githooks/pre-commit.cjs`      | Pre-commit: prettier → eslint → rebuild min.js/min.css   |
