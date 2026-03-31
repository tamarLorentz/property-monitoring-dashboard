const API_BASE = "http://localhost:8001";

export interface CaseSummary {
  case_number: string;
  case_types: string;
  latest_activity_date: string | null;
  current_status: string | null;
  activity_count: number;
}

export interface ActivityRecord {
  date: string;
  case_type: string;
  status: string;
}

export async function getCases(): Promise<CaseSummary[]> {
  const res = await fetch(`${API_BASE}/api/cases`);
  if (!res.ok) throw new Error("Failed to fetch cases");
  return res.json();
}

export async function getCaseDetail(caseNumber: string): Promise<ActivityRecord[]> {
  const res = await fetch(`${API_BASE}/api/cases/${caseNumber}`);
  if (!res.ok) throw new Error("Failed to fetch case detail");
  return res.json();
}
