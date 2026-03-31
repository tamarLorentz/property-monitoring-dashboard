import sqlite3
from pathlib import Path

# DB is at project root / data / property_monitoring.db
DB_PATH = Path(__file__).parent.parent.parent / "data" / "property_monitoring.db"

_CREATE_CASES = """
CREATE TABLE IF NOT EXISTS cases (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    case_number TEXT NOT NULL,
    case_type   TEXT NOT NULL,
    date_closed TEXT,
    detail_url  TEXT,
    UNIQUE(case_number, case_type)
);
"""

_CREATE_ACTIVITIES = """
CREATE TABLE IF NOT EXISTS activities (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id     INTEGER NOT NULL,
    date        TEXT,
    status      TEXT,
    UNIQUE(case_id, date, status),
    FOREIGN KEY (case_id) REFERENCES cases(id)
);
"""


def init_db(db_path=None):
    path = db_path or DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute(_CREATE_CASES)
    conn.execute(_CREATE_ACTIVITIES)
    conn.commit()
    conn.close()
