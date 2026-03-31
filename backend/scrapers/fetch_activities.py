import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable, Optional

from backend.scrapers.scraper import HEADERS, parse_detail_page
from backend.db.utils import get_connection, get_all_cases, insert_activity

MAX_WORKERS = 10


def _fetch_one(case):
    url = case.get("detail_url", "")
    case_number = case["case_number"]
    if not url:
        return case["id"], case_number, case["case_type"], []
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        activities = parse_detail_page(resp.text, case_number)
        return case["id"], case_number, case["case_type"], activities
    except requests.RequestException as e:
        print(f"  [ERROR] {case_number}: {e}")
        return case["id"], case_number, case["case_type"], []


def fetch_all_activities(db_path=None, progress_callback: Optional[Callable[[int, int], None]] = None):
    conn = get_connection(db_path)
    try:
        cases = get_all_cases(conn)
        total = len(cases)
        print(f"Fetching activities for {total} case(s) with {MAX_WORKERS} workers...")

        results = []
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {executor.submit(_fetch_one, case): case for case in cases}
            for i, future in enumerate(as_completed(futures), start=1):
                case_id, case_number, case_type, activities = future.result()
                print(f"[{i}/{total}] Case {case_number} ({case_type}) — {len(activities)} activity record(s)")
                results.append((case_id, activities))
                if progress_callback:
                    progress_callback(i, total)

        for case_id, activities in results:
            for activity in activities:
                insert_activity(conn, case_id, activity)
        conn.commit()
        print(f"Done. Fetched activities for {len(results)} case(s).")
    finally:
        conn.close()


if __name__ == "__main__":
    fetch_all_activities()
