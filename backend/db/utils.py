import sqlite3
from backend.db.schema import DB_PATH


def get_connection(db_path=None):
    path = db_path or DB_PATH
    conn = sqlite3.connect(path)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn


def insert_case(conn, case):
    """Insert case if not exists. Returns the row id (new or existing)."""
    conn.execute(
        "INSERT OR IGNORE INTO cases (case_number, case_type, date_closed, detail_url) "
        "VALUES (?, ?, ?, ?)",
        (
            case["case_number"],
            case.get("case_type", ""),
            case.get("date_closed", ""),
            case.get("detail_url", ""),
        ),
    )
    row = conn.execute(
        "SELECT id FROM cases WHERE case_number = ? AND case_type = ?",
        (case["case_number"], case.get("case_type", "")),
    ).fetchone()
    return row["id"]


def insert_activity(conn, case_id, activity):
    conn.execute(
        "INSERT OR IGNORE INTO activities (case_id, date, status) "
        "VALUES (?, ?, ?)",
        (
            case_id,
            activity.get("date", ""),
            activity.get("status", ""),
        ),
    )


def get_all_cases(conn):
    rows = conn.execute("SELECT * FROM cases").fetchall()
    return [dict(row) for row in rows]
