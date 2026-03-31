import requests
from bs4 import BeautifulSoup

from backend.db.utils import get_connection, insert_case

BASE_URL = "https://housingapp.lacity.org"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/123.0.0.0 Safari/537.36"
    )
}

CASE_TABLE_KEYWORDS = {"case number", "case type", "date closed"}
ACTIVITY_TABLE_KEYWORDS = {"date", "status"}


def find_table_by_headers(soup, required_keywords):
    for table in soup.find_all("table"):
        header_row = table.find("tr")
        if not header_row:
            continue
        cells = header_row.find_all(["th", "td"])
        texts = [c.get_text(strip=True).lower() for c in cells]
        matched = {}
        for keyword in required_keywords:
            for i, text in enumerate(texts):
                if keyword in text:
                    matched[keyword] = i
                    break
        if len(matched) == len(required_keywords):
            return table, matched
    return None, {}


def parse_cases_page(html, apn: str):
    soup = BeautifulSoup(html, "lxml")
    table, col_map = find_table_by_headers(soup, CASE_TABLE_KEYWORDS)

    if table is None:
        print("[WARNING] Could not find cases table on main page.")
        return []

    cases = []
    rows = table.find_all("tr")[1:]

    for row in rows:
        cells = row.find_all(["td", "th"])
        if len(cells) < 3:
            continue

        def cell_text(key):
            idx = col_map.get(key)
            return cells[idx].get_text(strip=True) if idx is not None and idx < len(cells) else ""

        case_number = cell_text("case number")
        case_type_raw = cell_text("case type")
        date_closed = cell_text("date closed")

        if not case_number:
            continue

        a_tag = row.find("a", attrs={"data-casetype": True})
        if not a_tag:
            print(f"[WARNING] No data-casetype found for case {case_number}, skipping.")
            continue
        case_type_numeric = a_tag["data-casetype"]
        detail_url = (
            f"{BASE_URL}/reportviolation/Pages/PublicPropertyActivityReport"
            f"?APN={apn}&CaseType={case_type_numeric}&CaseNo={case_number}"
        )

        cases.append({
            "case_number": case_number,
            "case_type": case_type_raw,
            "date_closed": date_closed,
            "detail_url": detail_url,
        })

    return cases


def parse_detail_page(html, case_number):
    soup = BeautifulSoup(html, "lxml")

    activity_table = None
    for tag in soup.find_all(["caption", "h1", "h2", "h3", "h4", "th"]):
        if "property activity" in tag.get_text(strip=True).lower():
            activity_table = tag.find_parent("table")
            if activity_table:
                break

    if activity_table is None:
        activity_table, _ = find_table_by_headers(soup, ACTIVITY_TABLE_KEYWORDS)

    if activity_table is None:
        print(f"[WARNING] No activity table found for case {case_number}.")
        return []

    header_row = activity_table.find("tr")
    if not header_row:
        return []

    header_cells = header_row.find_all(["th", "td"])
    header_texts = [c.get_text(strip=True).lower() for c in header_cells]

    date_idx = next((i for i, t in enumerate(header_texts) if "date" in t), None)
    status_idx = next((i for i, t in enumerate(header_texts) if "status" in t), None)

    activity_log = []
    for row in activity_table.find_all("tr")[1:]:
        cells = row.find_all(["td", "th"])
        date = cells[date_idx].get_text(strip=True) if date_idx is not None and date_idx < len(cells) else ""
        status = cells[status_idx].get_text(strip=True) if status_idx is not None and status_idx < len(cells) else ""
        if date or status:
            activity_log.append({"date": date, "status": status})

    return activity_log


def scrape(apn: str, db_path=None):
    list_url = f"{BASE_URL}/reportviolation/Pages/PropAtivityCases?APN={apn}"
    print(f"Fetching main page: {list_url}")
    resp = requests.get(list_url, headers=HEADERS, timeout=15)
    resp.raise_for_status()

    cases = parse_cases_page(resp.text, apn)
    print(f"Found {len(cases)} case(s).")

    conn = get_connection(db_path)
    try:
        conn.execute("DELETE FROM activities WHERE case_id IN (SELECT id FROM cases)")
        conn.execute("DELETE FROM cases")
        conn.commit()

        for case in cases:
            insert_case(conn, case)
        conn.commit()
        print(f"Scraped {len(cases)} case(s) for APN {apn}.")
    finally:
        conn.close()

    return cases


if __name__ == "__main__":
    scrape("2654002037")
