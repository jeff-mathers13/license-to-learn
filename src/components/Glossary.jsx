// Searchable glossary — 99 terms covering everything the quiz bank and calculators use.

import { useState } from "react";
import { INK, MUTED, CONTOUR, CHART_BLUE, SURFACE } from "../theme";
import { GLOSSARY_TERMS } from "../data/glossary";

export function GlossaryPage() {
  const [search, setSearch] = useState("");
  const filtered = GLOSSARY_TERMS.filter(
    (t) => t.term.toLowerCase().includes(search.toLowerCase()) || t.def.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => a.term.localeCompare(b.term));

  return (
    <div>
      <div className="chart-head" style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>GLOSSARY</div>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>
        Every acronym and term used across the quiz explanations and calculators, in one place.
      </div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search terms…"
        style={{ width: "100%", background: SURFACE, border: `1px solid ${CONTOUR}`, borderRadius: 4, padding: "9px 12px", fontSize: 13, color: INK, marginBottom: 16, boxSizing: "border-box" }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ fontSize: 13, color: MUTED }}>No terms match "{search}".</div>
        ) : (
          filtered.map((t, i) => (
            <div key={i} className="paper-panel" style={{ borderRadius: 4, padding: "12px 16px" }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: CHART_BLUE, marginBottom: 3 }}>{t.term}</div>
              <div style={{ fontSize: 13, color: INK, lineHeight: 1.5 }}>{t.def}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
