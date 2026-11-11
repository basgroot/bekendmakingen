"""Validate staged history JSON before the unattended workflow commits it."""

import json
import re
import subprocess
import sys
from datetime import date

from fetch_history import DATE_SUFFIX, FIELDS


def validate_content(content, filepath):
    """Check the history schema and that publication dates belong to the file's month."""
    month_match = re.search(r"-(\d{4}-\d{2})\.json$", filepath)
    if month_match is None:
        raise ValueError("not a monthly history JSON filename")
    data = json.loads(content)
    if not isinstance(data, dict) or not isinstance(data.get("publications"), list):
        raise ValueError("expected an object with a publications array")
    for index, pub in enumerate(data["publications"]):
        if not isinstance(pub, dict):
            raise ValueError(f"publication {index}: expected an object")
        for field in FIELDS:
            value = pub.get(field)
            if field == "location":
                valid = isinstance(value, list) and all(isinstance(coord, str) for coord in value)
            else:
                valid = isinstance(value, str)
            if not valid:
                raise ValueError(f"publication {index}: invalid or missing {field}")
        timestamp = pub["date"]
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}" + re.escape(DATE_SUFFIX), timestamp):
            raise ValueError(f"publication {index}: invalid history date format")
        date.fromisoformat(timestamp[:10])
        if timestamp[:7] != month_match[1]:
            raise ValueError(f"publication {index}: date does not belong to {month_match[1]}")


def main():
    paths = subprocess.check_output([
        "git", "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z", "--", "history/",
    ]).decode("utf-8").split("\0")
    checked = 0
    invalid = 0
    for filepath in filter(None, paths):
        try:
            # Inspect the index, not the working tree: these are the bytes being committed.
            content = subprocess.check_output(["git", "show", ":" + filepath])
            validate_content(content, filepath)
        except (ValueError, UnicodeError, subprocess.CalledProcessError) as error:
            print(f"ERROR: {filepath}: {error}", file=sys.stderr)
            invalid += 1
        checked += 1
    if invalid:
        print(f"ERROR: {invalid} of {checked} staged history files are invalid; commit aborted.", file=sys.stderr)
        return 1
    print(f"Validated {checked} staged history JSON files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
