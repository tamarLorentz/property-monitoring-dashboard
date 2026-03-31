# Property Monitoring Dashboard

Monitors property violation cases and activity logs for a given APN from the LA Housing portal.

**Features:** scrape cases by APN · live progress tracking · activity timeline per case ·all the data are lokk clear in a dashboard with open/new filters ,urgency.

---

## Requirements

- Python 3.10+
- Node.js 18+

---

## Setup

```bash
# 1. Python virtual environment
py -m venv venv
venv\Scripts\pip install -r requirements.txt

# 2. Frontend
cd frontend && npm install && cd ..
```

---

## Running

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
venv\Scripts\activate
uvicorn backend.api.main:app --reload --port 8001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), enter an APN, and click **Scrape**.

---

## Tests

```bash
venv\Scripts\activate
python -m pytest tests -v
```

---
For more details about the system structure and future improvements, see the [Future Improvements](#future-improvements) section below.

