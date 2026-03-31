# Property Monitoring Dashboard

Monitors property violation cases and activity logs for a given APN from the LA Housing portal.

Data is stored in a local SQLite database (`data/property_monitoring.db`).

---

## First-time Setup

Double-click **`setup.bat`** (or run it in the terminal):

```
setup.bat
```

This will:
- Create a Python virtual environment (`venv/`)
- Install all required packages

---

## Running the Pipeline

Double-click **`run.bat`** (or run it in the terminal):

```
run.bat
```

This will:
1. Initialize the database (creates it if it doesn't exist)
2. Scrape all cases from the LA Housing portal
3. Fetch activity logs for every case

---

## Running Tests

```
venv\Scripts\python.exe -m pytest tests -v
```

---

## Project Structure

```
├── main.py                  # Pipeline entry point
├── setup.bat                # One-time setup
├── run.bat                  # Run the pipeline
├── requirements.txt
├── scrapers/
│   ├── scraper.py           # Scrapes cases → writes to DB
│   └── fetch_activities.py  # Fetches activity logs → writes to DB
├── db/
│   ├── schema.py            # SQLite schema & init
│   └── utils.py             # DB helpers (insert, query)
├── tests/                   # Unit tests
└── data/
    └── property_monitoring.db  # SQLite database (auto-created)
```

---

## Configuration

To monitor a different property, change the `APN` value in `scrapers/scraper.py`:

```python
APN = "2654002037"
```
