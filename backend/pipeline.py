from backend.db.schema import init_db
from backend.scrapers.scraper import scrape
from backend.scrapers.fetch_activities import fetch_all_activities


def run_pipeline(apn: str):
    print("=== Property Monitoring Dashboard ===\n")

    print("Step 1: Initializing database...")
    init_db()
    print("Database initialized.\n")

    print("Step 2: Scraping cases...")
    scrape(apn)
    print()

    print("Step 3: Fetching activity logs...")
    fetch_all_activities()
    print()

    print("=== Pipeline complete ===")


if __name__ == "__main__":
    import sys
    _apn = sys.argv[1] if len(sys.argv) > 1 else "2654002037"
    run_pipeline(_apn)
