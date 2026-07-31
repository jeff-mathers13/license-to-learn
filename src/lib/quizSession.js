// Paused-quiz persistence (reference-based, not full objects) and attempt-based scoring.

import { applyOptionOrder, shuffleQuestionOptions, QUESTION_BY_ID, QUESTION_BY_TEXT } from "../data/questions";
import { CATEGORY_TO_SECTION, OFFICIAL_SECTIONS } from "../data/syllabus";

export function serializePausedSession({ questions, index, answer, missed, sessionTotal }) {
  return {
    v: 2,
    questionIds: questions.map((q) => q.id),
    optionOrders: questions.map((q) => q.optionOrder),
    index,
    answer: answer ?? null,
    missed: missed.map((m) => ({ id: m.id, chosenIndex: m.chosenIndex })),
    sessionTotal,
  };
}

export function resolveLegacyQuestion(stored) {
  const canonical = (stored?.id && QUESTION_BY_ID[stored.id]) || QUESTION_BY_TEXT[stored?.q];
  if (!canonical) return null;
  const order = (stored.options || []).map((opt) => canonical.options.indexOf(opt));
  const usable = order.length === canonical.options.length && order.every((i) => i >= 0);
  return usable ? applyOptionOrder(canonical, order) : shuffleQuestionOptions(canonical);
}

export function rehydratePausedSession(paused) {
  if (!paused) return null;

  let questions;
  if (paused.questionIds) {
    questions = paused.questionIds
      .map((id, i) => {
        const canonical = QUESTION_BY_ID[id];
        if (!canonical) return null;
        const order = paused.optionOrders?.[i];
        const usable = Array.isArray(order) && order.length === canonical.options.length;
        return usable ? applyOptionOrder(canonical, order) : shuffleQuestionOptions(canonical);
      })
      .filter(Boolean);
  } else {
    questions = (paused.questions || []).map(resolveLegacyQuestion).filter(Boolean);
  }

  if (!questions.length) return null;

  const byId = {};
  questions.forEach((q) => { byId[q.id] = q; });
  const missed = (paused.missed || [])
    .map((m) => {
      const id = m.id || QUESTION_BY_TEXT[m.q]?.id;
      return byId[id] ? { ...byId[id], chosenIndex: m.chosenIndex } : null;
    })
    .filter(Boolean);

  return {
    questions,
    index: Math.min(Math.max(paused.index || 0, 0), questions.length - 1),
    answer: paused.answer ?? null,
    missed,
    sessionTotal: Math.min(Math.max(paused.sessionTotal || 0, 0), questions.length),
  };
}

export function pausedLength(paused) {
  return paused?.questionIds?.length ?? paused?.questions?.length ?? 0;
}

export function latestAttempt(quizAttempts, category) {
  const arr = quizAttempts?.[category];
  return arr && arr.length ? arr[arr.length - 1] : null;
}

export function previousAttempt(quizAttempts, category) {
  const arr = quizAttempts?.[category];
  return arr && arr.length > 1 ? arr[arr.length - 2] : null;
}

export function attemptPct(attempt) {
  return attempt && attempt.total > 0 ? Math.round((attempt.correct / attempt.total) * 100) : null;
}

export function computeSectionScores(quizAttempts) {
  const agg = {};
  OFFICIAL_SECTIONS.forEach((s) => (agg[s] = { correct: 0, total: 0 }));
  Object.keys(quizAttempts || {}).forEach((cat) => {
    const latest = latestAttempt(quizAttempts, cat);
    if (!latest) return;
    const section = CATEGORY_TO_SECTION[cat];
    if (section && agg[section]) {
      agg[section].correct += latest.correct;
      agg[section].total += latest.total;
    }
  });
  return agg;
}
