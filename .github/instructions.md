# Project Context & Rules: Property Monitoring MVP

## 🛠 Tech Stack
- **Language:** Python 3.12 (Backend), JavaScript/React (Frontend)
- **Frameworks:** FastAPI (API), BeautifulSoup4 (Scraping), Vite (React Bundler)
- **Database:** SQLite  (keep it simple and file-based)

## 🏗 Architecture Rules
1. **Separation of Concerns:** The Scraper must be a standalone script/module. The API should only serve data that has already been collected.
2. **Data Flow:** Scraper -> Database -> FastAPI -> React Frontend. No direct scraping from the Frontend.
3. **Stateless API:** The FastAPI server should be lightweight, focusing on GET endpoints for the dashboard.
4. **Tooling:** Use `pip` for Python dependencies and `npm` for React.

## ⚖️ Business Logic Guidelines
1. **Urgency First:** Every piece of data should be evaluated for its "Actionability" (Is it urgent? Does it need a manager's attention?).
2. **Human Readable:** Convert raw city codes/statuses into friendly labels where possible.
3. **Efficiency:** The solution should be easy to run with 2-3 terminal commands max.

## 🎨 Style Guide
- **Python Naming:** `snake_case` for functions and variables, `PascalCase` for classes.
- **React Naming:** `camelCase` for variables/hooks, `PascalCase` for components.
- **Type Safety:** Use Pydantic models for API responses to ensure the Frontend knows what to expect.
- **Documentation:** Brief docstrings for complex logic; otherwise, write self-documenting code.

## 🚫 Critical Constraints
- **Do NOT** over-engineer. Avoid complex Auth or Cloud setups unless explicitly asked.
- **Do NOT** hardcode credentials or long URLs in multiple places; use a central config or constants.