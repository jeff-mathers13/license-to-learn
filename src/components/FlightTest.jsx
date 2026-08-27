// The PPL Flight Test prep section: an open-book oral drill, the pre-test checklist, the
// two mock planning assignments, and the My Aircraft card that feeds numbers into all of
// them. Deliberately shares nothing with the PPAER quiz screens beyond the visual language
// — the two tests are scored and studied in completely different ways.

import { useState, useMemo } from "react";
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight, AlertTriangle, ArrowLeft, ArrowRight,
  Plane, ClipboardList, Gauge, BookOpen, Pencil, X,
} from "lucide-react";
import {
  INK, MUTED, PAPER, PANEL, CONTOUR, MAGENTA, CHART_BLUE, OLIVE,
  ERROR, ERROR_BG, SUCCESS_BG, ON_ACCENT, SURFACE, TRACK_BG, CONTOUR_55,
} from "../theme";
import {
  FT_SECTIONS, FT_CHECKLIST_ROWS, FT_CHECKLIST_COLUMNS, FT_ASSIGNMENTS,
  FT_ASSIGNMENT_PREREQS, AIRCRAFT_FIELD_GROUPS, FT_REQUIRED_READINGS, FT_REFERENCE_PUBS,
} from "../data/flightTest";
import { FT_DECK, FT_TOTAL_CARDS } from "../data/flightTestDeck";
import {
  sectionStats, overallStats, buildQueue, checklistProgress, aircraftCardProgress, cardAircraftValues,
} from "../lib/flightTest";

const RATING_COLOR = { confident: OLIVE, shaky: MAGENTA, unknown: ERROR };
const RATING_LABEL = { confident: "Confident", shaky: "Shaky", unknown: "No idea" };

// ── Shared bits ──────────────────────────────────────────────────────────────

// Three-segment bar showing confident / shaky / unknown against the section total, with
// the untouched remainder left as track. Reads at a glance without needing numbers.
function ReadinessBar({ stats, height = 6 }) {
  const seg = (n) => (stats.total ? (n / stats.total) * 100 : 0);
  return (
    <div style={{ display: "flex", height, borderRadius: height, overflow: "hidden", background: TRACK_BG }}>
      <div style={{ width: `${seg(stats.confident)}%`, background: OLIVE }} />
      <div style={{ width: `${seg(stats.shaky)}%`, background: MAGENTA }} />
      <div style={{ width: `${seg(stats.unknown)}%`, background: ERROR }} />
    </div>
  );
}

function SectionRow({ section, stats, onClick }) {
  return (
    <button
      onClick={onClick}
      className="topic-row"
      style={{
        display: "block", width: "100%", textAlign: "left", background: "none",
        border: "none", borderBottom: `1px solid ${CONTOUR_55}`, padding: "14px 16px", cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
        <span className="chart-head" style={{ fontSize: 14, fontWeight: 700, color: INK }}>{section.title}</span>
        <span className="mono" style={{ marginLeft: "auto", fontSize: 11, color: MUTED, flexShrink: 0 }}>
          {stats.confident}/{stats.total}
        </span>
        <ChevronRight size={14} color={MUTED} style={{ flexShrink: 0 }} />
      </div>
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 8, lineHeight: 1.5 }}>{section.blurb}</div>
      <ReadinessBar stats={stats} />
    </button>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────

export function FlightTestHome({ state, onOpenSection, onOpenNeedsWork, onOpenAircraft, onOpenChecklist, onOpenAssignments }) {
  const stats = overallStats(state.ratings);
  const needsWork = stats.shaky + stats.unknown;
  const check = checklistProgress(state.checklist);
  const card = aircraftCardProgress(state.aircraft);

  return (
    <div>
      <div className="paper-panel" style={{ borderRadius: 4, padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
          <span className="chart-head" style={{ fontSize: 20, fontWeight: 700 }}>FLIGHT TEST READINESS</span>
          <span className="mono" style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: stats.pct >= 80 ? OLIVE : MUTED }}>
            {stats.pct}%
          </span>
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 14, lineHeight: 1.6 }}>
          {stats.confident} of {stats.total} questions you can answer confidently. Nothing here is scored — you
          rate yourself, because in an open-book oral the only thing that matters is whether you can produce
          the answer and say where it came from.
        </div>
        <ReadinessBar stats={stats} height={8} />
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          {[
            ["confident", stats.confident],
            ["shaky", stats.shaky],
            ["unknown", stats.unknown],
          ].map(([key, n]) => (
            <span key={key} className="mono" style={{ fontSize: 11, color: MUTED, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: RATING_COLOR[key], display: "inline-block" }} />
              {RATING_LABEL[key]} {n}
            </span>
          ))}
          <span className="mono" style={{ fontSize: 11, color: MUTED, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: TRACK_BG, display: "inline-block" }} />
            Unrated {stats.unrated}
          </span>
        </div>
      </div>

      {needsWork > 0 && (
        <button
          onClick={onOpenNeedsWork}
          className="paper-panel"
          style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
            borderRadius: 4, padding: "14px 16px", marginBottom: 16, cursor: "pointer",
            borderLeft: `4px solid ${MAGENTA}`, flexWrap: "wrap",
          }}
        >
          <div>
            <div className="chart-head" style={{ fontSize: 14, fontWeight: 700, color: INK }}>Drill what needs work</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
              {needsWork} question{needsWork === 1 ? "" : "s"} across every section, worst first
            </div>
          </div>
          <ArrowRight size={16} color={MAGENTA} style={{ marginLeft: "auto" }} />
        </button>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
        <QuickCard
          icon={<Gauge size={16} color={CHART_BLUE} />}
          title="My Aircraft"
          detail={card.filled ? `${card.filled} of ${card.total} values recorded` : "Not started — 38 questions need these"}
          pct={card.pct}
          color={CHART_BLUE}
          onClick={onOpenAircraft}
        />
        <QuickCard
          icon={<ClipboardList size={16} color={OLIVE} />}
          title="Prep Checklist"
          detail={`${check.done} of ${check.total} boxes across both assignments and the test`}
          pct={check.pct}
          color={OLIVE}
          onClick={onOpenChecklist}
        />
        <QuickCard
          icon={<Plane size={16} color={MAGENTA} />}
          title="Mock Assignments"
          detail="Two planned flights to work up before your ground briefs"
          pct={null}
          color={MAGENTA}
          onClick={onOpenAssignments}
        />
      </div>

      <div className="paper-panel" style={{ borderRadius: 4, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${CONTOUR_55}` }}>
          <span className="chart-head" style={{ fontSize: 15, fontWeight: 700 }}>TOPIC BLOCKS</span>
          <span className="mono" style={{ fontSize: 11, color: MUTED, marginLeft: 10 }}>{FT_TOTAL_CARDS} QUESTIONS</span>
        </div>
        {FT_SECTIONS.map((s) => (
          <SectionRow key={s.id} section={s} stats={sectionStats(s.id, state.ratings)} onClick={() => onOpenSection(s.id)} />
        ))}
      </div>

      <div className="paper-panel" style={{ borderRadius: 4, padding: "16px 20px" }}>
        <div className="chart-head" style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>WHAT TO BRING</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, color: MUTED, letterSpacing: 0.5, marginBottom: 6 }}>REQUIRED READINGS</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: INK, lineHeight: 1.8 }}>
              {FT_REQUIRED_READINGS.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 10, color: MUTED, letterSpacing: 0.5, marginBottom: 6 }}>REFERENCE PUBLICATIONS</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: INK, lineHeight: 1.8 }}>
              {FT_REFERENCE_PUBS.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickCard({ icon, title, detail, pct, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="paper-panel"
      style={{ textAlign: "left", borderRadius: 4, padding: "14px 16px", cursor: "pointer", borderTop: `3px solid ${color}` }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        {icon}
        <span className="chart-head" style={{ fontSize: 14, fontWeight: 700, color: INK }}>{title}</span>
      </div>
      <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5, marginBottom: pct === null ? 0 : 10 }}>{detail}</div>
      {pct !== null && (
        <div style={{ height: 4, borderRadius: 4, background: TRACK_BG, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: color }} />
        </div>
      )}
    </button>
  );
}

// ── Drill ────────────────────────────────────────────────────────────────────

export function FlightTestDrill({ state, sectionId, mode, onRate, onNote, onExit, onOpenAircraft }) {
  const queue = useMemo(() => buildQueue(sectionId, mode, state.ratings), [sectionId, mode, state.ratings]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const section = FT_SECTIONS.find((s) => s.id === sectionId);
  const heading = mode === "needswork" ? "Needs work" : section ? section.title : "All questions";

  // The needs-work queue is built from ratings, so rating a card removes it from the queue
  // mid-run and everything after it shifts down. Clamping here keeps the index valid rather
  // than dropping the user onto a blank screen at the end.
  const safeIdx = Math.min(idx, Math.max(0, queue.length - 1));
  const card = queue[safeIdx];

  if (!card) {
    return (
      <div className="paper-panel" style={{ borderRadius: 4, padding: 28, textAlign: "center" }}>
        <CheckCircle2 size={28} color={OLIVE} style={{ marginBottom: 10 }} />
        <div className="chart-head" style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Nothing left in this queue</div>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 18, lineHeight: 1.6 }}>
          {mode === "needswork"
            ? "You've cleared everything you'd marked shaky or unsure. Come back after a few days — spacing is what makes it stick."
            : "Every question in this block has been rated."}
        </div>
        <button
          onClick={onExit}
          className="mono"
          style={{ fontSize: 12, fontWeight: 700, color: ON_ACCENT, background: MAGENTA, border: "none", borderRadius: 4, padding: "10px 18px", cursor: "pointer" }}
        >
          BACK TO OVERVIEW
        </button>
      </div>
    );
  }

  const { filled, missing } = cardAircraftValues(card, state.aircraft);
  const currentRating = state.ratings[card.id]?.r;
  const cardSection = FT_SECTIONS.find((s) => s.id === card.sectionId);

  const advance = () => {
    setRevealed(false);
    setNoteOpen(false);
    setIdx((i) => Math.min(i + 1, queue.length - 1));
  };

  const rate = (rating) => {
    onRate(card.id, rating);
    // In a needs-work run, marking confident drops this card out of the queue, so the next
    // card slides into the current index — don't advance past it.
    if (mode === "needswork" && rating === "confident") {
      setRevealed(false);
      setNoteOpen(false);
    } else {
      advance();
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <button
          onClick={onExit}
          className="mono"
          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: MUTED, background: "none", border: `1px solid ${CONTOUR}`, borderRadius: 3, padding: "6px 10px", cursor: "pointer" }}
        >
          <ArrowLeft size={12} /> OVERVIEW
        </button>
        <span className="mono" style={{ fontSize: 11, color: MUTED, marginLeft: "auto" }}>
          {safeIdx + 1} / {queue.length}
        </span>
      </div>

      <div className="paper-panel" style={{ borderRadius: 4, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <span className="mono" style={{ fontSize: 11, color: MAGENTA }}>
            {(mode === "needswork" && cardSection ? cardSection.title : heading).toUpperCase()}
          </span>
          {currentRating && (
            <span className="mono" style={{ fontSize: 10, color: RATING_COLOR[currentRating], border: `1px solid ${RATING_COLOR[currentRating]}`, borderRadius: 3, padding: "2px 7px" }}>
              {RATING_LABEL[currentRating].toUpperCase()}
            </span>
          )}
        </div>

        <div className="chart-head" style={{ fontSize: 18, fontWeight: 700, marginBottom: 18, lineHeight: 1.45 }}>{card.q}</div>

        {!revealed && (
          <div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 14, lineHeight: 1.6 }}>
              Answer it out loud first, the way you would to the examiner — including where you'd look it up.
              Then reveal and compare.
            </div>
            <button
              onClick={() => setRevealed(true)}
              className="chart-head"
              style={{ background: MAGENTA, color: ON_ACCENT, border: "none", borderRadius: 4, padding: "12px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              REVEAL ANSWER
            </button>
          </div>
        )}

        {revealed && (
          <div>
            <div style={{ fontSize: 13.5, color: INK, lineHeight: 1.65, marginBottom: 14 }}>{card.a}</div>

            <div
              className="mono"
              style={{
                fontSize: 11, color: CHART_BLUE, background: SURFACE, border: `1px solid ${CONTOUR}`,
                borderRadius: 4, padding: "9px 12px", lineHeight: 1.6, marginBottom: 12,
              }}
            >
              LOOK IT UP IN: {card.src}
            </div>

            {filled.length > 0 && (
              <div style={{ border: `1px solid ${CONTOUR}`, borderRadius: 4, marginBottom: 12, overflow: "hidden" }}>
                <div className="mono" style={{ fontSize: 10, color: MUTED, letterSpacing: 0.5, padding: "8px 12px", borderBottom: `1px solid ${CONTOUR_55}`, background: SURFACE }}>
                  YOUR AIRCRAFT
                </div>
                {filled.map((f) => (
                  <div key={f.id} style={{ display: "flex", gap: 10, padding: "7px 12px", fontSize: 12, alignItems: "baseline" }}>
                    <span style={{ color: MUTED }}>{f.label}</span>
                    <span className="mono" style={{ marginLeft: "auto", fontWeight: 700, color: INK, textAlign: "right" }}>
                      {f.value}{f.unit ? ` ${f.unit}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {missing.length > 0 && (
              <button
                onClick={onOpenAircraft}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
                  background: SURFACE, border: `1px dashed ${CHART_BLUE}`, borderRadius: 4,
                  padding: "10px 12px", marginBottom: 12, cursor: "pointer", color: INK,
                }}
              >
                <Gauge size={14} color={CHART_BLUE} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                  This answer needs {missing.map((m) => m.label).join(", ")} from your aircraft — add {missing.length === 1 ? "it" : "them"} to My Aircraft.
                </span>
                <ArrowRight size={13} color={CHART_BLUE} style={{ flexShrink: 0, marginLeft: "auto" }} />
              </button>
            )}

            {card.verify && (
              <div style={{ display: "flex", gap: 8, background: ERROR_BG, border: `1px solid ${ERROR}`, borderRadius: 4, padding: "10px 12px", marginBottom: 12 }}>
                <AlertTriangle size={14} color={ERROR} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11.5, color: INK, lineHeight: 1.5 }}>
                  Verify this against your own POH or the current regulation before quoting it — it commonly differs by model, serial or year.
                </span>
              </div>
            )}

            <button
              onClick={() => setNoteOpen((o) => !o)}
              className="mono"
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: MUTED, background: "none", border: `1px solid ${CONTOUR}`, borderRadius: 3, padding: "6px 10px", cursor: "pointer", marginBottom: noteOpen ? 10 : 16 }}
            >
              <Pencil size={11} />
              {state.notes[card.id] ? "YOUR ANSWER (SAVED)" : "WRITE YOUR OWN ANSWER"}
              {noteOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </button>
            {noteOpen && (
              <textarea
                value={state.notes[card.id] || ""}
                onChange={(e) => onNote(card.id, e.target.value)}
                placeholder="In your own words — this is what you'll actually say."
                rows={4}
                style={{
                  width: "100%", boxSizing: "border-box", background: PAPER, color: INK,
                  border: `1.5px solid ${CONTOUR}`, borderRadius: 4, padding: "9px 11px",
                  fontSize: 12.5, lineHeight: 1.6, marginBottom: 16, fontFamily: "inherit", resize: "vertical",
                }}
              />
            )}

            <div className="mono" style={{ fontSize: 10, color: MUTED, letterSpacing: 0.5, marginBottom: 8 }}>
              COULD YOU HAVE ANSWERED THAT?
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["confident", "shaky", "unknown"].map((key) => (
                <button
                  key={key}
                  onClick={() => rate(key)}
                  className="mono"
                  style={{
                    flex: "1 1 100px", fontSize: 12, fontWeight: 700, padding: "11px 8px",
                    borderRadius: 4, cursor: "pointer", border: `1.5px solid ${RATING_COLOR[key]}`,
                    background: currentRating === key ? RATING_COLOR[key] : "none",
                    color: currentRating === key ? ON_ACCENT : RATING_COLOR[key],
                  }}
                >
                  {RATING_LABEL[key].toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
        <button
          onClick={() => { setRevealed(false); setNoteOpen(false); setIdx((i) => Math.max(0, i - 1)); }}
          disabled={safeIdx === 0}
          className="mono"
          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: safeIdx === 0 ? CONTOUR : MUTED, background: "none", border: `1px solid ${CONTOUR}`, borderRadius: 3, padding: "8px 12px", cursor: safeIdx === 0 ? "default" : "pointer" }}
        >
          <ArrowLeft size={12} /> PREV
        </button>
        <button
          onClick={advance}
          disabled={safeIdx >= queue.length - 1}
          className="mono"
          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: safeIdx >= queue.length - 1 ? CONTOUR : MUTED, background: "none", border: `1px solid ${CONTOUR}`, borderRadius: 3, padding: "8px 12px", cursor: safeIdx >= queue.length - 1 ? "default" : "pointer", marginLeft: "auto" }}
        >
          SKIP <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

// Section picker shown when the Drill tab is opened without a section chosen.
export function FlightTestDrillPicker({ state, onPick, onPickNeedsWork }) {
  const stats = overallStats(state.ratings);
  const needsWork = stats.shaky + stats.unknown;
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="chart-head" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>ORAL DRILL</div>
        <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
          {FT_TOTAL_CARDS} questions from the Glacier Air preparation document. Answer out loud, reveal, rate yourself honestly.
        </div>
      </div>

      {needsWork > 0 && (
        <button
          onClick={onPickNeedsWork}
          className="paper-panel"
          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", borderRadius: 4, padding: "14px 16px", marginBottom: 16, cursor: "pointer", borderLeft: `4px solid ${MAGENTA}` }}
        >
          <div>
            <div className="chart-head" style={{ fontSize: 14, fontWeight: 700, color: INK }}>Needs work</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{needsWork} question{needsWork === 1 ? "" : "s"}, worst and stalest first</div>
          </div>
          <ArrowRight size={16} color={MAGENTA} style={{ marginLeft: "auto" }} />
        </button>
      )}

      <div className="paper-panel" style={{ borderRadius: 4, overflow: "hidden" }}>
        {FT_SECTIONS.map((s) => (
          <SectionRow key={s.id} section={s} stats={sectionStats(s.id, state.ratings)} onClick={() => onPick(s.id)} />
        ))}
      </div>
    </div>
  );
}

// ── My Aircraft ──────────────────────────────────────────────────────────────

export function MyAircraftCard({ state, onChange, onClose }) {
  const progress = aircraftCardProgress(state.aircraft);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <div className="chart-head" style={{ fontSize: 20, fontWeight: 700 }}>MY AIRCRAFT</div>
        <span className="mono" style={{ fontSize: 11, color: MUTED, marginLeft: "auto" }}>{progress.filled}/{progress.total}</span>
        {onClose && (
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", padding: 2 }}>
            <X size={18} />
          </button>
        )}
      </div>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, marginBottom: 18 }}>
        These are the numbers no study guide can give you — they come from your POH, your weight and balance
        report and your own paperwork. Fill them in once and they appear inside every drill answer that needs them.
      </div>

      {AIRCRAFT_FIELD_GROUPS.map((group) => (
        <div key={group.id} className="paper-panel" style={{ borderRadius: 4, padding: "16px 18px", marginBottom: 14 }}>
          <div className="chart-head" style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{group.title}</div>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 14, lineHeight: 1.5 }}>{group.note}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
            {group.fields.map((f) => (
              <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: MUTED }}>
                  {f.label}{f.unit ? ` (${f.unit})` : ""}
                </label>
                <input
                  type="text"
                  value={state.aircraft[f.id] || ""}
                  onChange={(e) => onChange(f.id, e.target.value)}
                  placeholder={f.placeholder || ""}
                  style={{
                    width: "100%", boxSizing: "border-box", background: PAPER, color: INK,
                    border: `1.5px solid ${state.aircraft[f.id] ? OLIVE : CONTOUR}`, borderRadius: 4,
                    padding: "7px 9px", fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Checklist ────────────────────────────────────────────────────────────────

export function FlightTestChecklist({ state, onToggle }) {
  const progress = checklistProgress(state.checklist);
  return (
    <div>
      <div className="chart-head" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>PREP CHECKLIST</div>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, marginBottom: 16 }}>
        The twenty items from the Glacier Air sheet, worked three times — once for each ground brief assignment,
        and once for the test itself.
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {FT_CHECKLIST_COLUMNS.map((col) => {
          const c = progress.byColumn[col.id];
          const done = c.done === c.total;
          return (
            <div key={col.id} className="paper-panel" style={{ flex: "1 1 150px", borderRadius: 4, padding: "12px 14px", borderTop: `3px solid ${done ? OLIVE : CONTOUR}` }}>
              <div className="mono" style={{ fontSize: 10, color: MUTED, letterSpacing: 0.5, marginBottom: 4 }}>{col.label.toUpperCase()}</div>
              <div className="mono" style={{ fontSize: 17, fontWeight: 700, color: done ? OLIVE : INK }}>{c.done}/{c.total}</div>
            </div>
          );
        })}
      </div>

      <div className="paper-panel" style={{ borderRadius: 4, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, color: MUTED, fontWeight: 500, borderBottom: `1px solid ${CONTOUR}` }} />
              {FT_CHECKLIST_COLUMNS.map((col) => (
                <th
                  key={col.id}
                  className="mono"
                  style={{ padding: "12px 8px", fontSize: 10, color: MUTED, fontWeight: 700, letterSpacing: 0.5, borderBottom: `1px solid ${CONTOUR}`, width: 92 }}
                >
                  {col.label.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FT_CHECKLIST_ROWS.map((row) => (
              <tr key={row.id}>
                <td style={{ padding: "10px 14px", fontSize: 12.5, color: INK, borderBottom: `1px solid ${CONTOUR_55}` }}>{row.label}</td>
                {FT_CHECKLIST_COLUMNS.map((col) => {
                  const checked = !!state.checklist[row.id]?.[col.id];
                  return (
                    <td key={col.id} style={{ textAlign: "center", padding: "6px 8px", borderBottom: `1px solid ${CONTOUR_55}` }}>
                      <button
                        onClick={() => onToggle(row.id, col.id)}
                        aria-label={`${row.label} — ${col.label}`}
                        aria-pressed={checked}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "inline-flex", color: checked ? OLIVE : CONTOUR }}
                      >
                        {checked ? <CheckCircle2 size={19} /> : <Circle size={19} />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Assignments ──────────────────────────────────────────────────────────────

export function FlightTestAssignments({ state, onChange }) {
  const [open, setOpen] = useState(FT_ASSIGNMENTS[0].id);
  return (
    <div>
      <div className="chart-head" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>MOCK ASSIGNMENTS</div>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, marginBottom: 16 }}>
        Assignment 1 is due before your first ground brief, Assignment 2 before the second. Record what you
        computed so you can defend the numbers rather than re-deriving them under pressure.
      </div>

      <div className="paper-panel" style={{ borderRadius: 4, padding: "16px 18px", marginBottom: 16 }}>
        <div className="chart-head" style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>REQUIRED FOR BOTH</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: INK, lineHeight: 1.75 }}>
          {FT_ASSIGNMENT_PREREQS.map((p, i) => <li key={i} style={{ marginBottom: 3 }}>{p}</li>)}
        </ul>
      </div>

      {FT_ASSIGNMENTS.map((a) => {
        const isOpen = open === a.id;
        const values = state.assignments[a.id] || {};
        const filled = a.outputs.filter((o) => (values[o.id] || "").trim()).length;
        return (
          <div key={a.id} className="paper-panel" style={{ borderRadius: 4, overflow: "hidden", marginBottom: 14, borderLeft: `4px solid ${filled === a.outputs.length ? OLIVE : MAGENTA}` }}>
            <button
              onClick={() => setOpen(isOpen ? null : a.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "none", border: "none", padding: "14px 16px", cursor: "pointer" }}
            >
              {isOpen ? <ChevronDown size={15} color={MUTED} /> : <ChevronRight size={15} color={MUTED} />}
              <span className="chart-head" style={{ fontSize: 15, fontWeight: 700, color: INK }}>{a.title}</span>
              <span className="mono" style={{ fontSize: 11, color: MUTED, marginLeft: "auto" }}>{filled}/{a.outputs.length}</span>
            </button>
            {isOpen && (
              <div style={{ padding: "0 16px 16px" }}>
                <div style={{ fontSize: 12.5, color: INK, lineHeight: 1.65, marginBottom: 10 }}>{a.brief}</div>
                <div style={{ fontSize: 12.5, color: INK, lineHeight: 1.65, background: SURFACE, border: `1px solid ${CONTOUR}`, borderRadius: 4, padding: "10px 12px", marginBottom: 8 }}>
                  <strong>Task:</strong> {a.task}
                </div>
                <div className="mono" style={{ fontSize: 10, color: MUTED, letterSpacing: 0.5, marginBottom: 14 }}>
                  LEGS: {a.legs.join("   ·   ")}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
                  {a.outputs.map((o) => (
                    <div key={o.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: MUTED }}>
                        {o.label}{o.unit ? ` (${o.unit})` : ""}
                      </label>
                      <input
                        type="text"
                        value={values[o.id] || ""}
                        onChange={(e) => onChange(a.id, o.id, e.target.value)}
                        placeholder={o.placeholder || ""}
                        style={{
                          width: "100%", boxSizing: "border-box", background: PAPER, color: INK,
                          border: `1.5px solid ${values[o.id] ? OLIVE : CONTOUR}`, borderRadius: 4,
                          padding: "7px 9px", fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
