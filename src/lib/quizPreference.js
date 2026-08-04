// Device display preference, same rationale as lib/themePreference.js: not part of the
// cloud-synced progress payload. Changing it only affects quizzes started after the
// change — an already-paused session keeps whatever length it was started with, since
// its exact question list is already serialized in pausedQuizzes.
export const QUIZ_LENGTH_KEY = "ppl-tracker-quiz-length-v1";

export const QUIZ_LENGTH_OPTIONS = [
  { key: "all", label: "All" },
  { key: "10", label: "10" },
  { key: "20", label: "20" },
  { key: "50", label: "50" },
];

export function getStoredQuizLength() {
  try {
    const saved = window.localStorage.getItem(QUIZ_LENGTH_KEY);
    return QUIZ_LENGTH_OPTIONS.some((o) => o.key === saved) ? saved : "all";
  } catch {
    return "all";
  }
}

export function setStoredQuizLength(key) {
  try {
    window.localStorage.setItem(QUIZ_LENGTH_KEY, key);
  } catch {
    // best-effort; the in-memory state still reflects the choice for this session
  }
}

// "all" -> null (no slicing); "10"/"20"/"50" -> the number.
export function resolveQuizLength(key) {
  return key === "all" ? null : Number(key);
}
