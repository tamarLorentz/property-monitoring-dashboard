import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from scrapers.scraper import normalize_case_type, parse_cases_page, parse_detail_page


class TestNormalizeCaseType(unittest.TestCase):
    def test_numeric_passthrough(self):
        self.assertEqual(normalize_case_type("1"), "1")
        self.assertEqual(normalize_case_type("5"), "5")

    def test_known_keywords(self):
        self.assertEqual(normalize_case_type("Complaint"), "1")
        self.assertEqual(normalize_case_type("Hearing"), "5")
        self.assertEqual(normalize_case_type("Case Management"), "3")

    def test_embedded_digits(self):
        self.assertEqual(normalize_case_type("Type3"), "3")

    def test_unknown_defaults_to_one(self):
        self.assertEqual(normalize_case_type("XYZ Unknown"), "1")


class TestParseCasesPage(unittest.TestCase):
    _HTML = """
    <html><body>
    <table>
      <tr><th>Case Number</th><th>Case Type</th><th>Date Closed</th></tr>
      <tr><td>100001</td><td>Complaint</td><td></td></tr>
      <tr><td>100002</td><td>Hearing</td><td>2024-06-01</td></tr>
    </table>
    </body></html>
    """

    def test_parses_two_cases(self):
        cases = parse_cases_page(self._HTML)
        self.assertEqual(len(cases), 2)

    def test_first_case_fields(self):
        cases = parse_cases_page(self._HTML)
        self.assertEqual(cases[0]["case_number"], "100001")
        self.assertEqual(cases[0]["case_type"], "Complaint")
        self.assertEqual(cases[0]["date_closed"], "")

    def test_detail_url_contains_case_number(self):
        cases = parse_cases_page(self._HTML)
        self.assertIn("CaseNo=100002", cases[1]["detail_url"])
        self.assertTrue(cases[1]["detail_url"].startswith("https://"))

    def test_skips_empty_case_number(self):
        html = """
        <html><body>
        <table>
          <tr><th>Case Number</th><th>Case Type</th><th>Date Closed</th></tr>
          <tr><td></td><td>Complaint</td><td></td></tr>
        </table>
        </body></html>
        """
        self.assertEqual(parse_cases_page(html), [])

    def test_no_table_returns_empty(self):
        self.assertEqual(parse_cases_page("<html><body></body></html>"), [])


class TestParseDetailPage(unittest.TestCase):
    _HTML = """
    <html><body>
    <table>
      <caption>Property Activity</caption>
      <tr><th>Date</th><th>Status</th></tr>
      <tr><td>2024-01-15</td><td>Inspection Completed</td></tr>
      <tr><td>2024-02-20</td><td>Notice Issued</td></tr>
    </table>
    </body></html>
    """

    def test_parses_activities(self):
        activities = parse_detail_page(self._HTML, "100001")
        self.assertEqual(len(activities), 2)
        self.assertEqual(activities[0]["date"], "2024-01-15")
        self.assertEqual(activities[0]["status"], "Inspection Completed")

    def test_empty_page_returns_empty(self):
        activities = parse_detail_page("<html><body></body></html>", "100001")
        self.assertEqual(activities, [])

    def test_no_html_in_values(self):
        activities = parse_detail_page(self._HTML, "100001")
        for a in activities:
            self.assertNotIn("<", a["date"])
            self.assertNotIn("<", a["status"])


if __name__ == "__main__":
    unittest.main()
