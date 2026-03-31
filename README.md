# Property Monitoring Dashboard

Monitors property violation cases and activity logs for a given APN from the LA Housing portal.

---

## Requirements

- Python 3.10+
- Node.js 18+

---

## First-time Setup

```bash
# 1. Create Python virtual environment and install dependencies
py -m venv venv
venv\Scripts\pip install -r requirements.txt

# 2. Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## Running the App

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
venv\Scripts\activate
uvicorn backend.api.main:app --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Running Tests

```bash
venv\Scripts\activate
python -m pytest tests -v
```

---

## Project Structure

```
├── backend/
│   ├── api/main.py          # FastAPI server (REST API)
│   ├── db/                  # SQLite schema & helpers
│   ├── scrapers/            # LA Housing scraper
│   └── pipeline.py          # Full scline
├── frontend/
│   └── src/                 # React + TypeScript UI
├── tests/                   # Unit tests
├── data/
│   └── property_monitoring.db  # SQLite database (auto-created, git-ignored)
└── requirements.txt
```
