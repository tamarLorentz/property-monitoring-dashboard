import { useEffect, useMemo, useState } from "react";
import { getCases, getCaseDetail, scrapeApn, CaseSummary, ActivityRecord } from "./api/cases";
import { CasesTable } from "./components/CasesTable";
import { UrgencySettings } from "./components/UrgencySettings";
import { loadUrgencyMap, getUrgency } from "./config/urgency";

type FilterType = "all" | "open" | "new";

function StatsBar({
  total, open, newCount, active, onFilter,
}: {
  total: number; open: number; newCount: number;
  active: FilterType; onFilter: (f: FilterType) => void;
}) {
  const cards: { key: FilterType; label: string; count: number; color: string; bg: string; activeBg: string; activeBorder: string }[] = [
    { key: "all",  label: "Total Cases", count: total,    color: "#1e3a5f", bg: "#f0f4f8", activeBg: "#1e3a5f",   activeBorder: "#1e3a5f" },
    { key: "open", label: "Open",        count: open,     color: "#16a34a", bg: "#f0fdf4", activeBg: "#16a34a",   activeBorder: "#16a34a" },
    { key: "new",  label: "New",         count: newCount, color: "#b45309", bg: "#fefce8", activeBg: "#b45309",   activeBorder: "#b45309" },
  ];
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: "1.5rem", flexWrap: "wrap" }}>
      {cards.map((c) => {
        const isActive = active === c.key;
        return (
          <button
            key={c.key}
            onClick={() => onFilter(c.key)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start",
              padding: "14px 24px", minWidth: 130, borderRadius: 10, cursor: "pointer",
              border: `2px solid ${isActive ? c.activeBorder : "#e2e8f0"}`,
              background: isActive ? c.activeBg : c.bg,
              color: isActive ? "#fff" : c.color,
              boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.15)" : "0 1px 3px rgba(0,0,0,0.06)",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{c.count}</span>
            <span style={{ fontSize: 12, fontWeight: 600, marginTop: 4, opacity: isActive ? 0.9 : 0.75, letterSpacing: "0.04em", textTransform: "uppercase" }}>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function App() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apnInput, setApnInput] = useState("");
  const [scraping, setScraping] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showSettings, setShowSettings] = useState(false);
  const [urgencyVersion, setUrgencyVersion] = useState(0);

  useEffect(() => {
    getCases()
      .then(setCases)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleScrape() {
    if (!apnInput.trim()) return;
    setScraping(true);
    setError(null);
    try {
      await scrapeApn(apnInput.trim());
      const data = await getCases();
      setCases(data);
      setSelected(null);
      setDetail([]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setScraping(false);
    }
  }

  function handleSelect(key: string) {
    if (selected === key) {
      setSelected(null);
      setDetail([]);
      return;
    }
    setSelected(key);
    setDetail([]);
    setDetailLoading(true);
    getCaseDetail(Number(key))
      .then(setDetail)
      .catch((e) => setError(e.message))
      .finally(() => setDetailLoading(false));
  }

  const openCount = cases.filter((c) => c.is_open).length;
  const newCount = cases.filter((c) => c.is_new).length;

  const urgencyMap = useMemo(() => loadUrgencyMap(), [urgencyVersion]);

  const filteredCases = useMemo(() => {
    const base =
      filter === "open" ? cases.filter((c) => c.is_open)
      : filter === "new"  ? cases.filter((c) => c.is_new)
      : cases;
    return base.slice().sort((a, b) => {
      if (a.is_open !== b.is_open) return a.is_open ? -1 : 1;
      if (a.is_new  !== b.is_new)  return a.is_new  ? -1 : 1;
      return getUrgency(b.case_type, urgencyMap) - getUrgency(a.case_type, urgencyMap);
    });
  }, [cases, filter, urgencyMap]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div style={{ fontFamily: "Inter, sans-serif", padding: "2rem", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ color: "#1e3a5f", marginBottom: 4 }}>Property Monitoring Dashboard</h1>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          type="text"
          value={apnInput}
          onChange={(e) => setApnInput(e.target.value)}
          placeholder="Enter APN"
          style={{ padding: "0.4rem 0.75rem", fontSize: 14, border: "1px solid #d1d5db", borderRadius: 6 }}
        />
        <button
          onClick={handleScrape}
          disabled={scraping}
          style={{ padding: "0.4rem 1rem", fontSize: 14, background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 6, cursor: scraping ? "not-allowed" : "pointer" }}
        >
          {scraping ? "Scraping..." : "Scrape"}
        </button>
        <button
          onClick={() => setShowSettings(true)}
          style={{
            marginLeft: "auto", padding: "0.4rem 1rem", fontSize: 14,
            background: "#f8fafc", color: "#1e3a5f", border: "2px solid #1e3a5f",
            borderRadius: 6, cursor: "pointer", fontWeight: 600,
          }}
        >
          ⚙ Urgency Settings
        </button>
      </div>
      <StatsBar
        total={cases.length}
        open={openCount}
        newCount={newCount}
        active={filter}
        onFilter={setFilter}
      />
      <CasesTable
        cases={filteredCases}
        selected={selected}
        onSelect={handleSelect}
        detail={detail}
        detailLoading={detailLoading}
        urgencyMap={urgencyMap}
      />
      {showSettings && (
        <UrgencySettings
          cases={cases}
          onClose={() => { setShowSettings(false); setUrgencyVersion((v) => v + 1); }}
        />
      )}
      </div>
    </div>
  );
}

export default App;
