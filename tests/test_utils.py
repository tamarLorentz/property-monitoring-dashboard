import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from db.schema import init_db
from db.utils import get_connection, insert_case, insert_activity, get_all_cases


class TestUtils(unittest.TestCase):
    def setUp(self):
        fd, self.db_path = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        init_db(self.db_path)

    def tearDown(self):
        os.unlink(self.db_path)

    # --- cases ---

    def test_insert_case(self):
        conn = get_connection(self.db_path)
        insert_case(conn, {
            "case_number": "100001",
            "case_type": "Complaint",
            "date_closed": "",
            "detail_url": "http://example.com",
        })
        conn.commit()
        cases = get_all_cases(conn)
        conn.close()
        self.assertEqual(len(cases), 1)
        self.assertEqual(cases[0]["case_number"], "100001")

    def test_insert_case_idempotent(self):
        conn = get_connection(self.db_path)
        case = {
            "case_number": "100001",
            "case_type": "Complaint",
            "date_closed": "",
            "detail_url": "http://example.com",
        }
        insert_case(conn, case)
        insert_case(conn, case)  # INSERT OR IGNORE — must not raise or duplicate
        conn.commit()
        cases = get_all_cases(conn)
        conn.close()
        self.assertEqual(len(cases), 1)

    def test_insert_case_same_number_different_type(self):
        conn = get_connection(self.db_path)
        insert_case(conn, {"case_number": "100001", "case_type": "Complaint", "date_closed": "", "detail_url": ""})
        insert_case(conn, {"case_number": "100001", "case_type": "Hearing", "date_closed": "", "detail_url": ""})
        conn.commit()
        cases = get_all_cases(conn)
        conn.close()
        self.assertEqual(len(cases), 2)

    # --- activities ---

    def _insert_seed_case(self, conn):
        insert_case(conn, {
            "case_number": "100001",
            "case_type": "Complaint",
            "date_closed": "",
            "detail_url": "",
        })
        conn.commit()

    def test_insert_activity(self):
        conn = get_connection(self.db_path)
        self._insert_seed_case(conn)
        insert_activity(conn, "100001", "Complaint", {"date": "2024-01-01", "status": "Open"})
        conn.commit()
        rows = conn.execute(
            "SELECT * FROM activities WHERE case_number = '100001'"
        ).fetchall()
        conn.close()
        self.assertEqual(len(rows), 1)

    def test_insert_activity_idempotent(self):
        conn = get_connection(self.db_path)
        self._insert_seed_case(conn)
        activity = {"date": "2024-01-01", "status": "Open"}
        insert_activity(conn, "100001", "Complaint", activity)
        insert_activity(conn, "100001", "Complaint", activity)  # INSERT OR REPLACE — must not duplicate
        conn.commit()
        rows = conn.execute(
            "SELECT * FROM activities WHERE case_number = '100001'"
        ).fetchall()
        conn.close()
        self.assertEqual(len(rows), 1)

    def test_get_all_cases_empty(self):
        conn = get_connection(self.db_path)
        cases = get_all_cases(conn)
        conn.close()
        self.assertEqual(cases, [])


if __name__ == "__main__":
    unittest.main()
