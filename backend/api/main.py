import sqlite3
import threading
from datetime import datetime
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.db.schema import DB_PATH, init_db
from backend.scrapers.scraper import scrape
from backend.scrapers.fetch_activities import fetch_all_activities

app = FastAPI(title="Property Monitoring API")


@app.on_event("startup")
def on_startup():
    init_db()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# Convert MM/DD/YYYY HH:MM:SS AM/PM → YYYYMMDD for correct text-based date ordering
_DATE_SORT = "substr({d},7,4)||substr({d},1,2)||substr({d},4,2)"

_DATE_FMTS = ("%m/%d/%Y %I:%M:%S %p", "%m/%d/%Y")


def _parse_date(raw: str | None):
    if not raw:
        return None
    for fmt in _DATE_FMTS:
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    return None


def _days_since(raw: str | None) -> int | None:
    dt = _parse_date(raw)
    if dt is None:
        return None
    return (datetime.now().date() - dt.date()).days


@app.get("/api/cases")
def get_cases():
    conn = get_conn()
    rows = conn.execute("""
        SELECT * FROM (
            SELECT
                c.id,
                c.case_number,
                c.case_type,
                (
                    SELECT a2.date FROM activities a2 WHERE a2.case_id = c.id
                    ORDER BY substr(a2.date,7,4)||substr(a2.date,1,2)||substr(a2.date,4,2) DESC
                    LIMIT 1
                ) AS latest_activity_date,
                (
                    SELECT a2.status FROM activities a2 WHERE a2.case_id = c.id
                    ORDER BY substr(a2.date,7,4)||substr(a2.date,1,2)||substr(a2.date,4,2) DESC
                    LIMIT 1
                ) AS current_status,
                (
                    SELECT a2.date FROM activities a2 WHERE a2.case_id = c.id
                    ORDER BY substr(a2.date,7,4)||substr(a2.date,1,2)||substr(a2.date,4,2) ASC
                    LIMIT 1
                ) AS date_opened,
                (SELECT COUNT(*) FROM activities a2 WHERE a2.case_id = c.id) AS activity_count,
                CASE WHEN c.date_closed IS NULL OR c.date_closed = '' THEN 1 ELSE 0 END AS is_open,
                c.date_closed,
                c.detail_url
            FROM cases c
        ) t
        ORDER BY
            is_open DESC,
            CASE WHEN latest_activity_date IS NULL THEN 1 ELSE 0 END,
            substr(latest_activity_date,7,4)||substr(latest_activity_date,1,2)||substr(latest_activity_date,4,2) DESC
    """).fetchall()
    conn.close()

    return [
        {
            "id": row["id"],
            "case_number": row["case_number"],
            "case_type": row["case_type"],
            "latest_activity_date": row["latest_activity_date"],
            "date_opened": row["date_opened"],
            "date_closed": row["date_closed"] or None,
            "current_status": row["current_status"],
            "activity_count": row["activity_count"],
            "is_open": bool(row["is_open"]),
            "detail_url": row["detail_url"],
            "days_since_last_activity": _days_since(row["latest_activity_date"]),
            "is_new": (lambda d: d is not None and d <= 100)(_days_since(row["latest_activity_date"])),
        }
        for row in rows
    ]


@app.get("/api/cases/by-id/{case_id}")
def get_case_detail(case_id: int):
    conn = get_conn()
    case_exists = conn.execute(
        "SELECT 1 FROM cases WHERE id = ? LIMIT 1", (case_id,)
    ).fetchone()

    if not case_exists:
        conn.close()
        raise HTTPException(status_code=404, detail="Case not found")

    rows = conn.execute("""
        SELECT a.date, c.case_type, a.status
        FROM activities a
        JOIN cases c ON c.id = a.case_id
        WHERE a.case_id = ?
        ORDER BY substr(a.date,7,4)||substr(a.date,1,2)||substr(a.date,4,2) DESC
    """, (case_id,)).fetchall()
    conn.close()

    return [dict(r) for r in rows]


class ScrapeRequest(BaseModel):
    apn: str


# ── Scrape state ─────────────────────────────────────────────────────
_scrape_lock = threading.Lock()
_scrape_state: dict[str, dict] = {}


def _set_state(apn: str, **kwargs):
    with _scrape_lock:
        _scrape_state.setdefault(apn, {}).update(kwargs)


def _run_pipeline(apn: str):
    try:
        _set_state(apn, state="scraping_cases", message="Scraping case list...", current=0, total=0)
        init_db()
        scrape(apn)
        _set_state(apn, state="fetching_activities", message="Fetching activities...")

        def on_progress(current: int, total: int):
            _set_state(apn, current=current, total=total,
                       message=f"Fetching activities: {current}/{total}")

        fetch_all_activities(progress_callback=on_progress)

        conn = sqlite3.connect(DB_PATH)
        count = conn.execute("SELECT COUNT(*) FROM cases").fetchone()[0]
        conn.close()
        _set_state(apn, state="done", message="Done", cases_scraped=count)
    except Exception as e:
        _set_state(apn, state="error", message=str(e))


@app.post("/api/scrape", status_code=202)
def start_scrape(body: ScrapeRequest, background_tasks: BackgroundTasks):
    if not body.apn.strip():
        raise HTTPException(status_code=422, detail="apn must be a non-empty string")
    apn = body.apn.strip()
    with _scrape_lock:
        if _scrape_state.get(apn, {}).get("state") in ("scraping_cases", "fetching_activities"):
            return {"status": "already_running"}
        _scrape_state[apn] = {"state": "scraping_cases", "message": "Scraping case list...", "current": 0, "total": 0}
    background_tasks.add_task(_run_pipeline, apn)
    return {"status": "started"}


@app.get("/api/scrape/status")
def get_scrape_status(apn: str):
    with _scrape_lock:
        status = dict(_scrape_state.get(apn, {"state": "idle"}))
    return status
