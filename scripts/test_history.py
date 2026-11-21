"""Regression tests for interrupted history writes and pre-commit validation."""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

import fetch_history
import validate_history


def publication():
    return {
        "date": "2026-11-10T00:00:00.000Z",
        "urlDoc": "", "urlApi": "", "type": "", "title": "Vergunning café",
        "description": "", "location": ["52.64 5.06"],
    }


class AtomicWriteTests(unittest.TestCase):
    def test_replacement_is_complete_and_atomic(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "hoorn-2026-11.json"
            original = b'{"publications":[]}'
            path.write_bytes(original)
            content = fetch_history.render([publication()])
            replace = os.replace

            def inspect_then_replace(source, destination):
                self.assertEqual(path.read_bytes(), original)
                self.assertEqual(Path(source).parent, path.parent)
                self.assertEqual(Path(source).read_bytes(), content.encode("utf-8"))
                replace(source, destination)

            with patch.object(fetch_history.os, "replace", side_effect=inspect_then_replace):
                fetch_history.write_atomic(str(path), content)
            self.assertEqual(path.read_bytes(), content.encode("utf-8"))
            self.assertEqual(list(path.parent.iterdir()), [path])

    @unittest.skipIf(os.name == "nt", "POSIX permission bits are not represented on Windows")
    def test_replacement_keeps_owner_only_permissions(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "hoorn-2026-11.json"
            path.write_bytes(b'{"publications":[]}')
            fetch_history.write_atomic(str(path), fetch_history.render([publication()]))
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)

    def test_failures_leave_existing_file_untouched_and_remove_temporary_file(self):
        for operation in ("fsync", "replace"):
            with self.subTest(operation=operation), tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / "hoorn-2026-11.json"
                original = b'{"publications":[]}'
                path.write_bytes(original)
                with patch.object(fetch_history.os, operation, side_effect=OSError("disk failure")):
                    with self.assertRaises(OSError):
                        fetch_history.write_atomic(str(path), "partial new contents")
                self.assertEqual(path.read_bytes(), original)
                self.assertEqual(list(path.parent.iterdir()), [path])

    def test_interruption_during_write_leaves_existing_file_untouched(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "hoorn-2026-11.json"
            path.write_text("original", encoding="utf-8")
            create_temp = tempfile.NamedTemporaryFile

            def interrupted_temp(**kwargs):
                handle = create_temp(**kwargs)
                write = handle.write

                def interrupted_write(content):
                    write(content[:5])
                    raise KeyboardInterrupt()

                handle.write = interrupted_write
                return handle

            with patch.object(fetch_history.tempfile, "NamedTemporaryFile", side_effect=interrupted_temp):
                with self.assertRaises(KeyboardInterrupt):
                    fetch_history.write_atomic(str(path), "new contents")
            self.assertEqual(path.read_text(encoding="utf-8"), "original")
            self.assertEqual(list(path.parent.iterdir()), [path])

    def test_creates_new_file_and_parent_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "2026" / "hoorn-2026-11.json"
            content = fetch_history.render([])
            fetch_history.write_atomic(str(path), content)
            self.assertEqual(path.read_bytes(), content.encode("utf-8"))


class PeriodsUpdateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.periods = Path(self.temp.name) / "periods.json"
        configuration = {
            "defaultPeriod": "14d",
            "recentDays": 42,
            "periods": [
                {"key": "3d", "val": "Publicaties laatste drie dagen", "days": 3, "description": "Drie dagen."},
                {"key": "all", "val": "Alle recente publicaties", "days": None, "description": "Alles."},
                {"key": "2026-10", "val": "Oktober 2026"},
                {"key": "2026-09", "val": "September 2026"},
            ],
        }
        self.periods.write_text(json.dumps(configuration, ensure_ascii=False, indent=4) + "\n", encoding="utf-8")

    def stored_keys(self):
        return [period["key"] for period in json.loads(self.periods.read_text(encoding="utf-8"))["periods"]]

    def test_adds_completed_month_before_the_existing_monthly_block(self):
        added = fetch_history.update_periods(self.periods, (2026, 11))
        self.assertEqual(added, ["2026-11"])
        self.assertEqual(self.stored_keys(), ["3d", "all", "2026-11", "2026-10", "2026-09"])
        entry = json.loads(self.periods.read_text(encoding="utf-8"))["periods"][2]
        self.assertEqual(entry, {"key": "2026-11", "val": "November 2026"})
        self.assertTrue(self.periods.read_text(encoding="utf-8").endswith("}\n"))

    def test_adds_multiple_months_newest_first(self):
        added = fetch_history.update_periods(self.periods, (2026, 12))
        self.assertEqual(added, ["2026-11", "2026-12"])
        self.assertEqual(self.stored_keys(), ["3d", "all", "2026-12", "2026-11", "2026-10", "2026-09"])

    def test_month_already_offered_is_not_rewritten(self):
        before = self.periods.read_bytes()
        with patch.object(fetch_history, "write_atomic") as write:
            added = fetch_history.update_periods(self.periods, (2026, 10))
        self.assertEqual(added, [])
        write.assert_not_called()
        self.assertEqual(self.periods.read_bytes(), before)

    def test_dry_run_reports_without_writing(self):
        before = self.periods.read_bytes()
        added = fetch_history.update_periods(self.periods, (2026, 11), dry_run=True)
        self.assertEqual(added, ["2026-11"])
        self.assertEqual(self.periods.read_bytes(), before)

    def test_missing_periods_file_is_ignored(self):
        self.periods.unlink()
        self.assertEqual(fetch_history.update_periods(self.periods, (2026, 11)), [])
        self.assertFalse(self.periods.exists())

    def test_only_completed_months_are_eligible(self):
        running = (2026, 11)
        self.assertEqual(fetch_history.completed_through(running, date(2026, 11, 20)), (2026, 10))
        self.assertEqual(fetch_history.completed_through((2026, 10), date(2026, 11, 20)), (2026, 10))
        self.assertEqual(fetch_history.completed_through((2026, 9), date(2026, 11, 20)), (2026, 9))
        self.assertEqual(fetch_history.completed_through((2026, 12), date(2026, 11, 20)), (2026, 10))


class ValidationTests(unittest.TestCase):
    def test_workflow_staging_ignores_interrupted_write_remnants(self):
        gitignore = Path(fetch_history.__file__).resolve().parent.parent / ".gitignore"
        with tempfile.TemporaryDirectory() as directory:
            subprocess.run(["git", "init", "-q", directory], check=True)
            (Path(directory) / ".gitignore").write_bytes(gitignore.read_bytes())
            history = Path(directory) / "history" / "2026"
            history.mkdir(parents=True)
            (history / "hoorn-2026-11.json").write_text(fetch_history.render([]), encoding="utf-8")
            (history / ".fetch-history-interrupted.tmp").write_text("partial", encoding="utf-8")
            subprocess.run(["git", "add", "history/2026"], cwd=directory, check=True)
            staged = subprocess.check_output(["git", "diff", "--cached", "--name-only"], cwd=directory)
            self.assertEqual(staged.decode("utf-8"), "history/2026/hoorn-2026-11.json\n")

    def test_accepts_empty_and_populated_history(self):
        for pubs in ([], [publication()]):
            validate_history.validate_content(fetch_history.render(pubs), "history/2026/hoorn-2026-11.json")

    def test_rejects_truncated_json_and_wrong_schema(self):
        for data in ('{"publications":[', '[]', '{}', '{"publications":{}}', '{"publications":[null]}'):
            with self.subTest(data=data), self.assertRaises(ValueError):
                validate_history.validate_content(data, "history/2026/hoorn-2026-11.json")

    def test_rejects_invalid_fields_and_dates(self):
        for field, value in (
            ("title", None), ("location", "52.64 5.06"), ("location", [None]),
            ("date", "2026-11-31T00:00:00.000Z"), ("date", "2026-10-10T00:00:00.000Z"),
            ("date", "2026-11-10"),
        ):
            pub = publication()
            pub[field] = value
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                validate_history.validate_content(json.dumps({"publications": [pub]}), "history/2026/hoorn-2026-11.json")

    def test_cli_checks_staged_bytes_and_blocks_leftover_temporary_files(self):
        script = str(Path(validate_history.__file__).resolve())
        with tempfile.TemporaryDirectory() as directory:
            subprocess.run(["git", "init", "-q", directory], check=True)
            path = Path(directory) / "history" / "2026" / "hoorn-2026-11.json"
            path.parent.mkdir(parents=True)

            def stage():
                subprocess.run(["git", "add", "--", "history/"], cwd=directory, check=True)

            def validate():
                return subprocess.run([sys.executable, script], cwd=directory, capture_output=True, text=True)

            path.write_text(fetch_history.render([publication()]), encoding="utf-8")
            stage()
            path.write_text("truncated", encoding="utf-8")
            self.assertEqual(validate().returncode, 0)
            stage()
            path.write_text(fetch_history.render([publication()]), encoding="utf-8")
            self.assertEqual(validate().returncode, 1)
            stage()
            temporary = path.parent / ".fetch-history-leftover.tmp"
            temporary.write_text("partial", encoding="utf-8")
            stage()
            result = validate()
            self.assertEqual(result.returncode, 1)
            self.assertIn(temporary.name, result.stderr)


if __name__ == "__main__":
    unittest.main()
