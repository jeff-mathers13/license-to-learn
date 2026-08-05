// Device display preference — deliberately separate from the storage adapter (lib/storage.js)
// and never synced through /api/progress. A different theme on desktop vs. mobile is fine;
// study progress is not.
export const THEME_KEY = "ppl-tracker-theme-v1";

const DARK_META_COLOR = "#161C19";
const LIGHT_META_COLOR = "#036676";

export function getStoredPreference() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "light";
  } catch {
    return "light";
  }
}

export function setStoredPreference(mode) {
  try {
    window.localStorage.setItem(THEME_KEY, mode);
  } catch {
    // best-effort; the in-memory state still reflects the choice for this session
  }
}

export function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(mode) {
  return mode === "dark" || (mode === "system" && systemPrefersDark()) ? "dark" : "light";
}

// Mirrors the inline script in index.html — that script only runs once, before React
// mounts, to avoid a flash; this is what keeps the DOM in sync after that (e.g. a live
// change via the settings modal, or the OS theme changing while "System" is selected).
export function applyResolvedTheme(resolved) {
  if (typeof document === "undefined") return;
  if (resolved === "dark") document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolved === "dark" ? DARK_META_COLOR : LIGHT_META_COLOR);
}
