import os
import sys
import sqlite3
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from db.schema import init_db


class TestSchema(unittest.TestCase):
    def setUp(self):
        fd, self.db_path = tempfile.mkstemp(suffix=".db")
        os.close(fd)

    def tearDown(self):
        os.unlink(self.db_path)

    def test_tables_created(self):
        init_db(self.db_path)
        conn = sqlite3.connect(self.db_path)
        tables = {
            row[0]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
        conn.close()
        self.assertIn("cases", tables)
        self.assertIn("activities", tables)

    def test_idempotent_init(self):
        init_db(self.db_path)
        init_db(self.db_path)  # must not raise


if __name__ == "__main__":
    unittest.main()
