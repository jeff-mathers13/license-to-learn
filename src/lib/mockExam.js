// Mock exam generation, reference-based persistence, and per-section scoring.

import { shuffleArray, shuffleQuestionOptions, applyOptionOrder, QUESTION_BY_ID, categoryFromId, QUIZ_BANK } from "../data/questions";
import { CATEGORY_TO_SECTION, OFFICIAL_SECTIONS } from "../data/syllabus";

export const EXAM_LENGTH_OPTIONS = [
  { length: 25, minutes: 45 },
  { length: 50, minutes: 90 },
  { length: 100, minutes: 180 },
];

export function genMockExam(length) {
  const perSection = Math.floor(length / 4);
  const remainder = length - perSection * 4;
  const sectionCounts = OFFICIAL_SECTIONS.map((_, i) => perSection + (i < remainder ? 1 : 0));

  const picks = [];
  OFFICIAL_SECTIONS.forEach((section, idx) => {
    const count = sectionCounts[idx];
    if (section === "Aeronautics — General Knowledge") {
      const asBank = QUIZ_BANK["Aircraft & Systems"];
      const hfBank = QUIZ_BANK["Human Factors"];
      const asShare = Math.round((count * asBank.length) / (asBank.length + hfBank.length));
      const hfShare = count - asShare;
      picks.push(...shuffleArray(asBank).slice(0, asShare).map(shuffleQuestionOptions));
      picks.push(...shuffleArray(hfBank).slice(0, hfShare).map(shuffleQuestionOptions));
    } else {
      picks.push(...shuffleArray(QUIZ_BANK[section]).slice(0, count).map(shuffleQuestionOptions));
    }
  });

  return {
    length,
    questions: shuffleArray(picks), // final order shuffled so sections aren't blocked together
    answers: {}, // { [questionId]: chosenIndex }
    flagged: [], // [questionId]
    startedAt: new Date().toISOString(),
    durationMinutes: EXAM_LENGTH_OPTIONS.find((o) => o.length === length)?.minutes ?? Math.round(length * 1.8),
    submitted: false,
    submittedAt: null,
  };
}

export function serializeExam(exam) {
  if (!exam) return null;
  return {
    v: 1,
    length: exam.length,
    questionIds: exam.questions.map((q) => q.id),
    optionOrders: exam.questions.map((q) => q.optionOrder),
    answers: exam.answers,
    flagged: exam.flagged,
    startedAt: exam.startedAt,
    durationMinutes: exam.durationMinutes,
    submitted: exam.submitted,
    submittedAt: exam.submittedAt,
  };
}

export function rehydrateExam(stored) {
  if (!stored || !stored.questionIds) return null;
  const questions = stored.questionIds
    .map((id, i) => {
      const canonical = QUESTION_BY_ID[id];
      if (!canonical) return null;
      const order = stored.optionOrders?.[i];
      const usable = Array.isArray(order) && order.length === canonical.options.length;
      return usable ? applyOptionOrder(canonical, order) : shuffleQuestionOptions(canonical);
    })
    .filter(Boolean);
  if (!questions.length) return null;
  return {
    length: stored.length,
    questions,
    answers: stored.answers || {},
    flagged: stored.flagged || [],
    startedAt: stored.startedAt,
    durationMinutes: stored.durationMinutes,
    submitted: !!stored.submitted,
    submittedAt: stored.submittedAt || null,
  };
}

export function scoreExamBySection(exam) {
  const agg = {};
  OFFICIAL_SECTIONS.forEach((s) => (agg[s] = { correct: 0, total: 0 }));
  exam.questions.forEach((q) => {
    const section = CATEGORY_TO_SECTION[categoryFromId(q.id)];
    const chosen = exam.answers[q.id];
    agg[section].total += 1;
    if (chosen === q.correct) agg[section].correct += 1;
  });
  return agg;
}
