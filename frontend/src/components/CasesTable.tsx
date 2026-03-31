import React from "react";
import { CaseSummary, ActivityRecord } from "../api/cases";
import { UrgencyLevel, URGENCY_COLORS, URGENCY_LABELS, getUrgency } from "../config/urgency";

function UrgencyStars({ level }: { level: UrgencyLevel }) {
  const color = URGENCY_COLORS[level];
  return (
    <span
      title={URGENCY_LABELS[level]}
      style={{ marginLeft: 6, fontSize: 12, letterSpacing: 1, verticalAlign: "middle" }}
    >
      {[1, 2, 3].map((n) => (
        <span key={n} style={{ color: n <= level ? color : "#e2e8f0" }}>★</span>
      ))}
    </span>
  );
}

const th: React.CSSProperties = {
  background: "#1e3a5f",
  color: "#fff",
  padding: "10px 14px",
  textAlign: "left",
  fontWeight: 600,
  fontSize: 13,
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "9px 14px",
  fontSize: 13,
  borderBottom: "1px solid #e5e7eb",
  verticalAlign: "middle",
};

function Badge({ open }: { open: boolean }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 700,
      background: open ? "#dcfce7" : "#f1f5f9",
      color: open ? "#16a34a" : "#64748b",
      border: `1px solid ${open ? "#86efac" : "#cbd5e1"}`,
    }}>
      {open ? "Open" : "Closed"}
    </span>
  );
}

function NewBadge() {
  return (
    <span style={{
      display: "inline-block",
      padding: "1px 7px",
      borderRadius: 10,
      fontSize: 10,
      fontWeight: 700,
      background: "#fef08a",
      color: "#854d0e",
      border: "1px solid #fde047",
      marginLeft: 6,
      verticalAlign: "middle",
      letterSpacing: "0.04em",
    }}>
      NEW
    </span>
  );
}

function daysAgoLabel(days: number | null): string {
  if (days === null) return "";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 365) {
    const years = Math.floor(days / 365);
    const rem = days % 365;
    return rem === 0 ? `${years}y ago` : `${years}y ${rem}d ago`;
  }
  return `${days}d ago`;
}

function formatDate(raw: string | null): string {
  if (!raw) return "—";
  return raw.split(" ")[0]; // MM/DD/YYYY
}

interface Props {
  cases: CaseSummary[];
  selected: string | null;
  onSelect: (caseNumber: string) => void;
  detail: ActivityRecord[];
  detailLoading: boolean;
  urgencyMap: Record<string, UrgencyLevel>;
}

const COL_COUNT = 7;

export function CasesTable({ cases, selected, onSelect, detail, detailLoading, urgencyMap }: Props) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", background: "#fff" }}>
        <thead>
          <tr>
            <th style={th}>Case #</th>
            <th style={th}>Case Type</th>
            <th style={th}>Status</th>
            <th style={th}>Latest Activity</th>
            <th style={th}>Opened</th>
            <th style={th}>Closed</th>
            <th style={th}>Link</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c, i) => {
            const rowKey = String(c.id);
            const isSelected = selected === rowKey;
            const rowBg = isSelected ? "#eff6ff" : i % 2 === 0 ? "#fff" : "#f9fafb";
            return (
              <React.Fragment key={rowKey}>
                <tr
                  onClick={() => onSelect(rowKey)}
                  style={{
                    cursor: "pointer",
                    background: rowBg,
                    borderLeft: isSelected ? "3px solid #3b82f6" : "3px solid transparent",
                  }}
                >
                  <td style={{ ...td, fontWeight: 600, color: "#1e3a5f" }}>
                    {c.case_number}
                    {c.is_open && c.is_new && <NewBadge />}
                    <span style={{ marginLeft: 6, fontSize: 10, color: "#94a3b8" }}>
                      {isSelected ? "▲" : "▼"}
                    </span>
                  </td>
                  <td style={td}>
                    {c.case_type}
                    <UrgencyStars level={getUrgency(c.case_type, urgencyMap)} />
                  </td>
                  <td style={td}><Badge open={c.is_open} /></td>
                  <td style={td}>
                    {c.latest_activity_date == null ? (
                      <span style={{ color: "#9ca3af", fontSize: 12 }}>No activity</span>
                    ) : (
                      <>
                        <div style={{ fontWeight: 500 }}>{c.current_status ?? "—"}</div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                          {formatDate(c.latest_activity_date)}
                          {c.is_open && c.days_since_last_activity !== null && (
                            <span style={{ marginLeft: 6, color: c.is_new ? "#b45309" : "#9ca3af" }}>
                              · {daysAgoLabel(c.days_since_last_activity)}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </td>
                  <td style={{ ...td, color: "#6b7280", fontSize: 12 }}>{formatDate(c.date_opened)}</td>
                  <td style={{ ...td, color: "#6b7280", fontSize: 12 }}>{formatDate(c.date_closed)}</td>
                  <td style={td} onClick={(e) => e.stopPropagation()}>
                    {c.detail_url
                      ? <a href={c.detail_url} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", fontSize: 12 }}>View ↗</a>
                      : "—"}
                  </td>
                </tr>

                {isSelected && (
                  <tr style={{ background: "#f0f7ff" }}>
                    <td
                      colSpan={COL_COUNT}
                      style={{ padding: "0 0 0 32px", borderBottom: "2px solid #bfdbfe", borderLeft: "3px solid #3b82f6" }}
                    >
                      <div style={{ padding: "12px 16px 16px 0" }}>
                        <div style={{
                          fontSize: 11, fontWeight: 700, color: "#1e3a5f",
                          letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10,
                        }}>
                          Activity Timeline — most recent first
                        </div>

                        {detailLoading ? (
                          <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Loading...</p>
                        ) : detail.length === 0 ? (
                          <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>No activities recorded for this case.</p>
                        ) : (
                          <table style={{ borderCollapse: "collapse", width: "100%" }}>
                            <tbody>
                              {detail.map((a, idx) => (
                                <tr key={idx} style={{ borderBottom: "1px solid #e0eeff" }}>
                                  <td style={{ padding: "5px 16px 5px 0", width: 150, fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
                                    {formatDate(a.date)}
                                  </td>
                                  <td style={{ padding: "5px 16px 5px 0", fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>
                                    {a.case_type}
                                  </td>
                                  <td style={{ padding: "5px 0", fontSize: 13, color: "#111827" }}>
                                    {a.status}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
