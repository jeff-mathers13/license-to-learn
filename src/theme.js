// Squamish-inspired palette: granite-charcoal ink, misty coastal background,
// deep Howe Sound teal and glacier blue accents, cedar-forest green for pass/complete states.
//
// Every value here is a CSS custom property reference, not a raw color — the actual
// light/dark values are defined once in index.html's <style> block (:root and
// [data-theme="dark"]). This is what makes theme switching free at every one of the
// ~390 call sites that do style={{color: INK}} etc.: the DOM resolves the variable,
// nothing in JS has to change per-render.
//
// Do NOT append a hex alpha suffix to any of these (the old `${CONTOUR}55` pattern) —
// that breaks once the value is `var(--contour)` instead of a literal hex string. Use
// one of the precomputed _33/_55/_66 alpha variants below instead.
export const INK = "var(--ink)";
export const MUTED = "var(--muted)";
export const PAPER = "var(--paper)";
export const PANEL = "var(--panel)";
export const CONTOUR = "var(--contour)";
export const MAGENTA = "var(--teal)";
export const CHART_BLUE = "var(--blue)";
export const OLIVE = "var(--olive)";

// Precomputed translucent variants, replacing the old `${CONTOUR}55`-style hex-alpha
// suffix pattern (kept at the same effective opacity: 33→20%, 55→33%, 66→40%).
export const CONTOUR_33 = "var(--contour-33)";
export const CONTOUR_55 = "var(--contour-55)";
export const CONTOUR_66 = "var(--contour-66)";
export const CHART_BLUE_66 = "var(--blue-66)";
export const MAGENTA_66 = "var(--teal-66)";

// Semantic tokens for UI chrome that was previously a one-off hardcoded hex at each
// call site (error/success banners, button label color, input surfaces, hover states).
export const ERROR = "var(--error)";
export const ERROR_BG = "var(--error-bg)";
export const SUCCESS_BG = "var(--success-bg)";
export const ON_ACCENT = "var(--on-accent)";
export const SURFACE = "var(--surface)";
export const TRACK_BG = "var(--track-bg)";
export const HOVER_BG = "var(--hover-bg)";
export const NAV_DOT_BG = "var(--nav-dot-bg)";
export const SECTION_TRACK_BG = "var(--section-track-bg)";
