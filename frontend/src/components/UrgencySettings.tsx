import { useState } from "react";
import { CaseSummary } from "../api/cases";
import {
  UrgencyLevel,
  URGENCY_COLORS,
  URGENCY_LABELS,
  loadUrgencyMap,
  saveUrgencyMap,
} from "../config/urgency";

interface Props {
  cases: CaseSummary[];
  onClose: () => void;
}

export function UrgencySettings({ cases, onClose }: Props) {
  // Derive distinct case types from loaded cases
  const caseTypes = Array.from(new Set(cases.map((c) => c.case_type))).sort();

  const [map, setMap] = useState<Record<string, UrgencyLevel>>(() => loadUrgencyMap());

  function setLevel(caseType: string, level: UrgencyLevel) {
    const next = { ...map, [caseType]: level };
    setMap(next);
  }

  function handleSave() {
    saveUrgencyMap(map);
    onClose();
  }

  return (
    /* Backdrop */
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleSave(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
    >
      {/* Panel */}
      <div style={{
        background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        width: 460, maxWidth: "95vw", maxHeight: "80vh",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          background: "#1e3a5f", color: "#fff", padding: "16px 20px",
          borderRadius: "12px 12px 0 0", display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.02em" }}>
            Urgency Settings per Case Type
          </span>
          <button
            onClick={handleSave}
            style={{
              background: "none", border: "none", color: "#fff",
              fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>

        {/* Legend */}
        <div style={{
          display: "flex", gap: 18, padding: "10px 20px",
          borderBottom: "1px solid #e5e7eb", fontSize: 12,
        }}>
          {([1, 2, 3] as UrgencyLevel[]).map((lvl) => (
            <span key={lvl} style={{ color: URGENCY_COLORS[lvl], fontWeight: 600 }}>
              {"★".repeat(lvl)}{"☆".repeat(3 - lvl)} {URGENCY_LABELS[lvl]}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
          {caseTypes.length === 0 ? (
            <p style={{ padding: "16px 20px", color: "#9ca3af", fontSize: 13 }}>
              No cases loaded yet.
            </p>
          ) : (
            caseTypes.map((ct) => {
              const current = map[ct] ?? 1;
              return (
                <div
                  key={ct}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 20px", borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#1e3a5f", flex: 1 }}>
                    {ct}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {([1, 2, 3] as UrgencyLevel[]).map((lvl) => {
                      const active = current === lvl;
                      const color = URGENCY_COLORS[lvl];
                      return (
                        <button
                          key={lvl}
                          onClick={() => setLevel(ct, lvl)}
                          title={URGENCY_LABELS[lvl]}
                          style={{
                            cursor: "pointer",
                            padding: "5px 11px",
                            borderRadius: 7,
                            border: `2px solid ${active ? color : "#e2e8f0"}`,
                            background: active ? color : "#f8fafc",
                            color: active ? "#fff" : "#94a3b8",
                            fontWeight: 700,
                            fontSize: 13,
                            transition: "all 0.12s",
                          }}
                        >
                          {"★".repeat(lvl)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 20px", borderTop: "1px solid #e5e7eb",
          display: "flex", justifyContent: "flex-end", gap: 10,
        }}>
          <button
            onClick={handleSave}
            style={{
              padding: "8px 24px", borderRadius: 7, border: "none",
              background: "#1e3a5f", color: "#fff", fontWeight: 600,
              fontSize: 14, cursor: "pointer",
            }}
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
