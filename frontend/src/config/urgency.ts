export type UrgencyLevel = 1 | 2 | 3;

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  1: "Low",
  2: "Medium",
  3: "High",
};

export const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  1: "#93c5fd", // light blue
  2: "#3b82f6", // blue
  3: "#1e40af", // dark blue
};

/** Sensible defaults — overridden by user saved in localStorage */
const DEFAULT_URGENCY_MAP: Record<string, UrgencyLevel> = {
  "Hearing":        3,
  "Complaint":      2,
  "Case Management": 1,
};

const LS_KEY = "urgency_map";

export function loadUrgencyMap(): Record<string, UrgencyLevel> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULT_URGENCY_MAP, ...JSON.parse(raw) };
  } catch {
    // ignore corrupt localStorage
  }
  return { ...DEFAULT_URGENCY_MAP };
}

export function saveUrgencyMap(map: Record<string, UrgencyLevel>): void {
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

export function getUrgency(
  caseType: string,
  map: Record<string, UrgencyLevel> = loadUrgencyMap()
): UrgencyLevel {
  return map[caseType] ?? 1;
}

export const SOURCE_URL = "https://housingapp.lacity.org/reportviolation/Pages/PropAtivityCases?APN=2654002037&Source=ActivityReport#divPropDetails";
