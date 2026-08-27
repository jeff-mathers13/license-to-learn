// State shape and derivations for the PPL Flight Test section.
//
// Unlike the PPAER quiz, nothing here is scored. A card carries a self-assigned rating
// ("confident" / "shaky" / "unknown") because in an open-book oral the only useful signal
// is whether you could produce and defend the answer on the spot — which no amount of
// multiple-choice bookkeeping can tell you.
//
// All of this lives inside the existing progress blob under a `flightTest` key, so it
// rides the same localStorage / Azure sync path as everything else (see lib/storage.js).

import { FT_DECK, FT_CARD_BY_ID } from "../data/flightTestDeck";
import { FT_SECTIONS, FT_CHECKLIST_ROWS, FT_CHECKLIST_COLUMNS, FT_ASSIGNMENTS, AIRCRAFT_FIELD_BY_ID } from "../data/flightTest";

export const RATING_KEYS = ["confident", "shaky", "unknown"];

export function emptyFlightTestState() {
  return {
    ratings: {},     // { [cardId]: { r: "confident"|"shaky"|"unknown", t: epochMs } }
    notes: {},       // { [cardId]: string } — your own wording, which is what you'll actually say
    aircraft: {},    // { [fieldId]: string }
    checklist: {},   // { [rowId]: { a1: bool, a2: bool, test: bool } }
    assignments: {}, // { [assignmentId]: { [outputId]: string } }
  };
}

// Drops anything that no longer corresponds to a card, field, row or assignment in the
// current data files, so editing the deck can't leave orphaned state behind forever.
export function rehydrateFlightTest(raw) {
  const state = emptyFlightTestState();
  if (!raw || typeof raw !== "object") return state;

  if (raw.ratings && typeof raw.ratings === "object") {
    Object.entries(raw.ratings).forEach(([id, v]) => {
      if (!FT_CARD_BY_ID[id] || !v) return;
      const r = typeof v === "string" ? v : v.r;
      if (!RATING_KEYS.includes(r)) return;
      const t = typeof v === "object" && Number.isFinite(v.t) ? v.t : null;
      state.ratings[id] = { r, t };
    });
  }

  if (raw.notes && typeof raw.notes === "object") {
    Object.entries(raw.notes).forEach(([id, v]) => {
      if (FT_CARD_BY_ID[id] && typeof v === "string" && v.trim()) state.notes[id] = v;
    });
  }

  if (raw.aircraft && typeof raw.aircraft === "object") {
    Object.entries(raw.aircraft).forEach(([id, v]) => {
      if (AIRCRAFT_FIELD_BY_ID[id] && typeof v === "string" && v.trim()) state.aircraft[id] = v;
    });
  }

  if (raw.checklist && typeof raw.checklist === "object") {
    const rowIds = new Set(FT_CHECKLIST_ROWS.map((r) => r.id));
    const colIds = FT_CHECKLIST_COLUMNS.map((c) => c.id);
    Object.entries(raw.checklist).forEach(([rowId, cols]) => {
      if (!rowIds.has(rowId) || !cols || typeof cols !== "object") return;
      const kept = {};
      colIds.forEach((c) => {
        if (cols[c]) kept[c] = true;
      });
      if (Object.keys(kept).length) state.checklist[rowId] = kept;
    });
  }

  if (raw.assignments && typeof raw.assignments === "object") {
    FT_ASSIGNMENTS.forEach((a) => {
      const saved = raw.assignments[a.id];
      if (!saved || typeof saved !== "object") return;
      const outIds = new Set(a.outputs.map((o) => o.id));
      const kept = {};
      Object.entries(saved).forEach(([k, v]) => {
        if (outIds.has(k) && typeof v === "string" && v.trim()) kept[k] = v;
      });
      if (Object.keys(kept).length) state.assignments[a.id] = kept;
    });
  }

  return state;
}

// Only non-empty branches are written, so an untouched flight-test section costs a few
// bytes in the synced payload rather than a skeleton of empty objects.
export function serializeFlightTest(state) {
  if (!state) return undefined;
  const out = {};
  if (Object.keys(state.ratings || {}).length) out.ratings = state.ratings;
  if (Object.keys(state.notes || {}).length) out.notes = state.notes;
  if (Object.keys(state.aircraft || {}).length) out.aircraft = state.aircraft;
  if (Object.keys(state.checklist || {}).length) out.checklist = state.checklist;
  if (Object.keys(state.assignments || {}).length) out.assignments = state.assignments;
  return Object.keys(out).length ? out : undefined;
}

// ── Derivations ──────────────────────────────────────────────────────────────

export function sectionStats(sectionId, ratings) {
  const cards = FT_DECK[sectionId] || [];
  const counts = { confident: 0, shaky: 0, unknown: 0, unrated: 0 };
  cards.forEach((c) => {
    const r = ratings?.[c.id]?.r;
    if (r && counts[r] !== undefined) counts[r] += 1;
    else counts.unrated += 1;
  });
  const total = cards.length;
  return {
    ...counts,
    total,
    // Readiness is confident-only on purpose — "shaky" is explicitly not ready, and
    // counting it would let the number drift up while you still can't answer the question.
    pct: total ? Math.round((counts.confident / total) * 100) : 0,
    touched: total - counts.unrated,
  };
}

export function overallStats(ratings) {
  const acc = { confident: 0, shaky: 0, unknown: 0, unrated: 0, total: 0 };
  FT_SECTIONS.forEach((s) => {
    const st = sectionStats(s.id, ratings);
    acc.confident += st.confident;
    acc.shaky += st.shaky;
    acc.unknown += st.unknown;
    acc.unrated += st.unrated;
    acc.total += st.total;
  });
  acc.pct = acc.total ? Math.round((acc.confident / acc.total) * 100) : 0;
  acc.touched = acc.total - acc.unrated;
  return acc;
}

// Builds the ordered list of cards for a drill run.
//   mode "all"      every card in the section, in document order
//   mode "needswork" only shaky + unknown, oldest rating first so the stalest resurfaces
//   mode "unrated"  only cards never rated
// `sectionId` of null draws across every section, which is how the "needs work" queue on
// the overview screen works.
export function buildQueue(sectionId, mode, ratings) {
  const source = sectionId ? (FT_DECK[sectionId] || []).map((c) => ({ ...c, sectionId })) : FT_SECTIONS.flatMap((s) => (FT_DECK[s.id] || []).map((c) => ({ ...c, sectionId: s.id })));

  if (mode === "unrated") return source.filter((c) => !ratings?.[c.id]);

  if (mode === "needswork") {
    return source
      .filter((c) => {
        const r = ratings?.[c.id]?.r;
        return r === "shaky" || r === "unknown";
      })
      .sort((a, b) => {
        // "unknown" ahead of "shaky", then oldest rating first.
        const ra = ratings[a.id], rb = ratings[b.id];
        if (ra.r !== rb.r) return ra.r === "unknown" ? -1 : 1;
        return (ra.t || 0) - (rb.t || 0);
      });
  }

  return source;
}

export function checklistProgress(checklist) {
  const total = FT_CHECKLIST_ROWS.length * FT_CHECKLIST_COLUMNS.length;
  let done = 0;
  const byColumn = {};
  FT_CHECKLIST_COLUMNS.forEach((col) => {
    const n = FT_CHECKLIST_ROWS.filter((row) => checklist?.[row.id]?.[col.id]).length;
    byColumn[col.id] = { done: n, total: FT_CHECKLIST_ROWS.length };
    done += n;
  });
  return { done, total, byColumn, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function aircraftCardProgress(aircraft) {
  const ids = Object.keys(AIRCRAFT_FIELD_BY_ID);
  const filled = ids.filter((id) => (aircraft?.[id] || "").trim()).length;
  return { filled, total: ids.length, pct: ids.length ? Math.round((filled / ids.length) * 100) : 0 };
}

// The aircraft values a given card wants, split into the ones you've filled in and the
// ones you haven't — the drill shows the first as part of the answer and the second as a
// prompt to go fill the card in.
export function cardAircraftValues(card, aircraft) {
  if (!card.fields?.length) return { filled: [], missing: [] };
  const filled = [], missing = [];
  card.fields.forEach((id) => {
    const def = AIRCRAFT_FIELD_BY_ID[id];
    if (!def) return;
    const value = (aircraft?.[id] || "").trim();
    if (value) filled.push({ ...def, value });
    else missing.push(def);
  });
  return { filled, missing };
}
