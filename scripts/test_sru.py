"""Offline regression fixtures for SRU errors and genuine empty results."""

import io
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

import fetch_history


EMPTY_RESPONSE = """<srw:searchRetrieveResponse xmlns:srw="http://www.loc.gov/zing/srw/">
  <srw:numberOfRecords>0</srw:numberOfRecords>
</srw:searchRetrieveResponse>"""

RECORD = """<srw:record><srw:recordData><gzd xmlns="urn:overheid:gzd">
  <available>2026-11-10</available><title>Vergunning café</title><type>vergunning</type>
  <enrichedData><preferredUrl>https://zoek.officielebekendmakingen.nl/gmb-2026-1.html</preferredUrl></enrichedData>
</gzd></srw:recordData></srw:record>"""

RECORD_RESPONSE = EMPTY_RESPONSE.replace(
    "<srw:numberOfRecords>0</srw:numberOfRecords>",
    "<srw:numberOfRecords>1</srw:numberOfRecords><srw:records>" + RECORD + "</srw:records>",
)

DIAGNOSTIC_RESPONSE = """<srw:searchRetrieveResponse xmlns:srw="http://www.loc.gov/zing/srw/"
    xmlns:diag="http://www.loc.gov/zing/srw/diagnostic/">
  <srw:diagnostics><diag:diagnostic>
    <diag:uri>info:srw/diagnostic/1/16</diag:uri>
    <diag:message>Unsupported index</diag:message><diag:details>dt.invalid</diag:details>
  </diag:diagnostic></srw:diagnostics>
</srw:searchRetrieveResponse>"""


class Response(io.BytesIO):
    status = 200

    def __init__(self, xml):
        super().__init__(xml.encode("utf-8"))


class SruParsingTests(unittest.TestCase):
    def parse(self, xml):
        return fetch_history.parse_publications(xml, "2026-11-01", set())

    def test_accepts_genuine_empty_response_with_or_without_records_container(self):
        self.assertEqual(self.parse(EMPTY_RESPONSE), ([], 0, None))
        self.assertEqual(self.parse(EMPTY_RESPONSE.replace(
            "</srw:searchRetrieveResponse>", "<srw:records/></srw:searchRetrieveResponse>",
        )), ([], 0, None))

    def test_parses_records_and_response_level_metadata(self):
        xml = RECORD_RESPONSE.replace("<available>", "<numberOfRecords>999</numberOfRecords><available>")
        pubs, total, next_pos = self.parse(xml)
        self.assertEqual(total, 1)
        self.assertIsNone(next_pos)
        self.assertEqual(len(pubs), 1)
        self.assertEqual(pubs[0]["title"], "Vergunning café")
        self.assertEqual(pubs[0]["date"], "2026-11-10")

    def test_permanent_diagnostic_preserves_uri_message_and_details(self):
        with self.assertRaises(fetch_history.SruResponseError) as raised:
            self.parse(DIAGNOSTIC_RESPONSE)
        self.assertFalse(raised.exception.retryable)
        for text in ("info:srw/diagnostic/1/16", "Unsupported index", "dt.invalid"):
            self.assertIn(text, str(raised.exception))

    def test_detects_record_level_diagnostic_even_with_valid_records(self):
        diagnostic_record = """<srw:record><srw:recordData>
          <diagnostic xmlns="http://www.loc.gov/zing/srw/diagnostic/">
            <uri>info:srw/diagnostic/1/64</uri><message>Record temporarily unavailable</message>
          </diagnostic></srw:recordData></srw:record>"""
        xml = RECORD_RESPONSE.replace("</srw:records>", diagnostic_record + "</srw:records>")
        with self.assertRaises(fetch_history.SruResponseError) as raised:
            self.parse(xml)
        self.assertTrue(raised.exception.retryable)

    def test_rejects_missing_negative_malformed_or_duplicate_count(self):
        field = "<srw:numberOfRecords>0</srw:numberOfRecords>"
        for replacement in ("", field + field, "<srw:numberOfRecords/>",
                            "<srw:numberOfRecords>-1</srw:numberOfRecords>",
                            "<srw:numberOfRecords>unknown</srw:numberOfRecords>"):
            with self.subTest(replacement=replacement), self.assertRaises(fetch_history.SruResponseError):
                self.parse(EMPTY_RESPONSE.replace(field, replacement))

    def test_rejects_inconsistent_counts_and_empty_pages_with_a_next_position(self):
        responses = (
            EMPTY_RESPONSE.replace(">0<", ">1<"),
            RECORD_RESPONSE.replace(">1<", ">0<"),
            EMPTY_RESPONSE.replace("</srw:searchRetrieveResponse>",
                                   "<srw:nextRecordPosition>2</srw:nextRecordPosition></srw:searchRetrieveResponse>"),
        )
        for xml in responses:
            with self.subTest(xml=xml), self.assertRaises(fetch_history.SruResponseError):
                self.parse(xml)

    def test_rejects_invalid_next_positions(self):
        for value in ("0", "-1", "", "unknown"):
            xml = RECORD_RESPONSE.replace(
                "</srw:searchRetrieveResponse>",
                f"<srw:nextRecordPosition>{value}</srw:nextRecordPosition></srw:searchRetrieveResponse>",
            )
            with self.subTest(value=value), self.assertRaises(fetch_history.SruResponseError):
                self.parse(xml)

    def test_rejects_unexpected_xml_root(self):
        for xml in ("<html/>", "<record/>", "<unrelated><numberOfRecords>0</numberOfRecords></unrelated>"):
            with self.subTest(xml=xml), self.assertRaises(fetch_history.SruResponseError):
                self.parse(xml)


class SruFetchTests(unittest.TestCase):
    def fetch(self):
        return fetch_history.fetch_publications("Hoorn", "Hoorn", "2026-11-01", "2026-11-30", Mock(), set())

    def test_permanent_diagnostic_fails_without_retrying(self):
        with patch.object(fetch_history, "urlopen", return_value=Response(DIAGNOSTIC_RESPONSE)) as request, \
                patch.object(fetch_history.time, "sleep") as sleep, redirect_stdout(io.StringIO()):
            self.assertEqual(self.fetch(), ([], False))
        request.assert_called_once()
        sleep.assert_not_called()

    def test_temporary_diagnostic_retries_and_can_recover(self):
        transient = DIAGNOSTIC_RESPONSE.replace("/1/16", "/1/2")
        with patch.object(fetch_history, "urlopen", side_effect=[Response(transient), Response(RECORD_RESPONSE)]) as request, \
                patch.object(fetch_history.time, "sleep") as sleep, redirect_stdout(io.StringIO()):
            pubs, success = self.fetch()
        self.assertTrue(success)
        self.assertEqual(len(pubs), 1)
        self.assertEqual(request.call_count, 2)
        sleep.assert_called_once()

    def test_protocol_error_retries_are_bounded(self):
        with patch.object(fetch_history, "urlopen", side_effect=lambda *args, **kwargs: Response("<html/>")) as request, \
                patch.object(fetch_history, "MAX_RETRIES", 2), \
                patch.object(fetch_history.time, "sleep") as sleep, redirect_stdout(io.StringIO()):
            self.assertEqual(self.fetch(), ([], False))
        self.assertEqual(request.call_count, 3)
        self.assertEqual(sleep.call_count, 2)

    def test_later_page_error_preserves_existing_files_and_does_not_create_missing_month(self):
        first_page = RECORD_RESPONSE.replace(
            "</srw:searchRetrieveResponse>",
            "<srw:nextRecordPosition>2</srw:nextRecordPosition></srw:searchRetrieveResponse>",
        ).replace(">1<", ">2<")
        for has_existing in (True, False):
            with self.subTest(has_existing=has_existing), tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / "2026" / "hoorn-2026-11.json"
                original = b'{"publications":[]}'
                if has_existing:
                    path.parent.mkdir()
                    path.write_bytes(original)
                args = SimpleNamespace(year=2026, month=11, municipality="Hoorn", history_dir=directory, full=True)
                with patch.object(fetch_history, "urlopen", side_effect=[Response(first_page), Response(DIAGNOSTIC_RESPONSE)]) as request, \
                        patch.object(fetch_history.time, "sleep") as sleep, redirect_stdout(io.StringIO()):
                    result = fetch_history.process(args, {"Hoorn": {}}, Mock())
                self.assertEqual(result, ([], [], [], ["hoorn"]))
                self.assertEqual(request.call_count, 2)
                sleep.assert_not_called()
                if has_existing:
                    self.assertEqual(path.read_bytes(), original)
                else:
                    self.assertFalse(path.exists())


if __name__ == "__main__":
    unittest.main()
