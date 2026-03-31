const API_BASE = "http://localhost:8001";

export interface CaseSummary {
  id: number;
  case_number: string;
  case_type: string;
  latest_activity_date: string | null;
  date_opened: string | null;
  date_closed: string | null;
  current_status: string | null;
  activity_count: number;
  is_open: boolean;
  detail_url: string | null;
  days_since_last_activity: number | null;
  is_new: boolean;
}

export interface ActivityRecord {
  date: string;
  case_type: string;
  status: string;
}

export async function getCases(): Promise<CaseSummary[]> {
  const res = await fetch(`${API_BASE}/api/cases`);
  if (!res.ok) throw new Error(`Failed to fetch cases (${res.status})`);
  return res.json();
}

export async function getCaseDetail(caseId: number): Promise<ActivityRecord[]> {
  const res = await fetch(`${API_BASE}/api/cases/by-id/${caseId}`);
  if (!res.ok) throw new Error("Failed to fetch case detail");
  return res.json();
}

export async function scrapeApn(apn: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apn }),
  });
  if (!res.ok) throw new Error("Failed to start scrape");
}

export interface ScrapeStatus {
  state: "idle" | "scraping_cases" | "fetching_activities" | "done" | "error";
  message?: string;
  current?: number;
  total?: number;
  cases_scraped?: number;
}

export async function getScrapeStatus(apn: string): Promise<ScrapeStatus> {
  const res = await fetch(`${API_BASE}/api/scrape/status?apn=${encodeURIComponent(apn)}`);
  if (!res.ok) throw new Error("Failed to get scrape status");
  return res.json();
}
