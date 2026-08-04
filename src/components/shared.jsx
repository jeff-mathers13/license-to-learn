// Small shared UI atoms used across the syllabus, quiz, and calculator screens.

import { useState } from "react";
import { Clock, ChevronDown, ChevronRight, Plane, Target, BookOpen, X } from "lucide-react";
import {
  INK, MUTED, PAPER, PANEL, CONTOUR, MAGENTA, CHART_BLUE, OLIVE,
  ERROR, ERROR_BG, SUCCESS_BG, ON_ACCENT, SURFACE, CONTOUR_66, CHART_BLUE_66,
} from "../theme";
import { WB_ENVELOPE } from "../lib/calculators";
import { loginUrl, logoutUrl } from "../lib/auth";

// Scrim + centered card, used for any confirmation/settings-style overlay. A static
// black scrim (not tied to the INK theme token) reads fine in either light or dark mode.
export function Modal({ onClose, maxWidth = 360, borderColor, children }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="paper-panel"
        style={{ borderRadius: 4, padding: 22, maxWidth, width: "100%", border: borderColor ? `1px solid ${borderColor}` : undefined }}
      >
        {children}
      </div>
    </div>
  );
}

// Segmented control used by each settings row below — a label plus a row of equal-width
// choice buttons, the currently-selected one filled with the accent color.
function SettingRow({ label, options, value, onChange }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 11, color: MUTED, marginBottom: 8, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        {options.map((opt) => {
          const isActive = value === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => onChange(opt.key)}
              className="mono"
              style={{
                flex: 1,
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                padding: "8px 0",
                borderRadius: 4,
                cursor: "pointer",
                border: `1.5px solid ${isActive ? MAGENTA : CONTOUR}`,
                background: isActive ? MAGENTA : "none",
                color: isActive ? ON_ACCENT : MUTED,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Built as a list of rows so future user-modifiable settings are just another row here,
// not a redesign.
export function SettingsModal({ mode, onModeChange, quizLength, onQuizLengthChange, onClose }) {
  const appearanceOptions = [
    { key: "system", label: "System" },
    { key: "light", label: "Light" },
    { key: "dark", label: "Dark" },
  ];
  const quizLengthOptions = [
    { key: "all", label: "All" },
    { key: "10", label: "10" },
    { key: "20", label: "20" },
    { key: "50", label: "50" },
  ];
  return (
    <Modal onClose={onClose} maxWidth={340}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <span className="chart-head" style={{ fontSize: 16, fontWeight: 700, color: INK }}>Settings</span>
        <button
          onClick={onClose}
          aria-label="Close settings"
          style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 2, display: "flex" }}
        >
          <X size={18} />
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SettingRow label="APPEARANCE" options={appearanceOptions} value={mode} onChange={onModeChange} />
        <SettingRow label="QUIZ SESSION LENGTH" options={quizLengthOptions} value={quizLength} onChange={onQuizLengthChange} />
      </div>
    </Modal>
  );
}

export function BottomTabBar({ active, onHome, onQuiz, onCalc, onExam }) {
  const tabs = [
    { key: "home", label: "HOME", icon: Plane, onClick: onHome, color: INK },
    { key: "quiz", label: "QUIZ", icon: BookOpen, onClick: onQuiz, color: MAGENTA },
    { key: "calc", label: "CALC", icon: Target, onClick: onCalc, color: CHART_BLUE },
    { key: "exam", label: "EXAM", icon: Clock, onClick: onExam, color: OLIVE },
  ];
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 880,
        background: PANEL,
        borderTop: `1px solid ${CONTOUR_66}`,
        display: "flex",
        zIndex: 50,
        boxShadow: "0 -2px 10px rgba(44,35,19,0.08)",
      }}
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={t.onClick}
            className="mono"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "10px 0 12px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: isActive ? t.color : MUTED,
              borderTop: isActive ? `2px solid ${t.color}` : "2px solid transparent",
              marginTop: -1,
            }}
          >
            <Icon size={18} color={isActive ? t.color : MUTED} strokeWidth={isActive ? 2.4 : 2} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: 0.5 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Stat({ icon, label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: MUTED }}>
        {icon} {label}
      </div>
      <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export function CalcHeader({ title, onNewProblem }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span className="chart-head" style={{ fontSize: 18, fontWeight: 700 }}>{title}</span>
      <button
        onClick={onNewProblem}
        className="mono"
        style={{ marginLeft: "auto", fontSize: 11, color: CHART_BLUE, background: "none", border: `1px solid ${CHART_BLUE}`, borderRadius: 3, padding: "5px 10px", cursor: "pointer", flexShrink: 0 }}
      >
        NEW PROBLEM
      </button>
    </div>
  );
}

export function NumberField({ label, value, onChange, unit, status }) {
  // status: undefined (not checked yet) | "correct" | "incorrect" — colors the field's
  // border/background the same way a wrong quiz answer is highlighted, so it's obvious
  // at a glance which specific input was off, not just that the overall answer was wrong.
  const border = status === "incorrect" ? ERROR : status === "correct" ? OLIVE : CONTOUR;
  const bg = status === "incorrect" ? ERROR_BG : status === "correct" ? SUCCESS_BG : PAPER;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, color: MUTED }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 100, background: bg, border: `1.5px solid ${border}`, borderRadius: 4, padding: "6px 8px", fontSize: 13, color: INK }}
        />
        {unit && <span className="mono" style={{ fontSize: 11, color: MUTED }}>{unit}</span>}
      </div>
    </div>
  );
}

export function SelectButtons({ options, value, onChange, checked, correctValue }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((opt) => {
        const isChosen = value === opt;
        let border = CONTOUR, bg = SURFACE, color = INK;
        if (checked) {
          if (opt === correctValue) {
            border = OLIVE; bg = SUCCESS_BG; color = OLIVE;
          } else if (isChosen) {
            border = ERROR; bg = ERROR_BG; color = ERROR;
          }
        } else if (isChosen) {
          border = MAGENTA; bg = MAGENTA; color = ON_ACCENT;
        }
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className="mono"
            style={{ fontSize: 12, fontWeight: 700, padding: "8px 16px", borderRadius: 4, cursor: "pointer", textTransform: "uppercase", border: `1.5px solid ${border}`, background: bg, color }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function ResultBanner({ correct, children }) {
  return (
    <div style={{ background: correct ? SUCCESS_BG : ERROR_BG, border: `1px solid ${correct ? OLIVE : ERROR}`, borderRadius: 4, padding: "12px 16px", fontSize: 12, color: correct ? OLIVE : ERROR, marginTop: 12 }}>
      {children}
    </div>
  );
}

export function CGEnvelopeGraph({ cg, weight, showPoint, pointOk }) {
  const cgAxisMin = 36, cgAxisMax = 49;
  const wAxisMin = 1600, wAxisMax = 2700;
  const plotLeft = 46, plotRight = 280, plotBottom = 178, plotTop = 14;

  const cgToX = (c) => plotLeft + ((c - cgAxisMin) / (cgAxisMax - cgAxisMin)) * (plotRight - plotLeft);
  const wToY = (w) => plotBottom - ((w - wAxisMin) / (wAxisMax - wAxisMin)) * (plotBottom - plotTop);

  const corners = [
    [WB_ENVELOPE.fwdAtMin, WB_ENVELOPE.minWeight],
    [WB_ENVELOPE.fwdAtMax, WB_ENVELOPE.maxWeight],
    [WB_ENVELOPE.aftAtMax, WB_ENVELOPE.maxWeight],
    [WB_ENVELOPE.aftAtMin, WB_ENVELOPE.minWeight],
  ];
  const polygonPoints = corners.map(([c, w]) => `${cgToX(c)},${wToY(w)}`).join(" ");

  const cgTicks = [38, 40, 42, 44, 46, 48];
  const wTicks = [1800, 2000, 2200, 2400, 2600];

  return (
    <div style={{ marginBottom: 16 }}>
      <svg viewBox="0 0 300 195" width="100%" height="180" style={{ display: "block", maxWidth: 320 }}>
        {/* axes */}
        <line x1={plotLeft} y1={plotTop} x2={plotLeft} y2={plotBottom} stroke={CONTOUR} strokeWidth="1" />
        <line x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} stroke={CONTOUR} strokeWidth="1" />
        {cgTicks.map((c) => (
          <g key={c}>
            <line x1={cgToX(c)} y1={plotBottom} x2={cgToX(c)} y2={plotBottom + 4} stroke={CONTOUR} strokeWidth="1" />
            <text x={cgToX(c)} y={plotBottom + 14} textAnchor="middle" fontSize="7" fill={MUTED} fontFamily="JetBrains Mono, monospace">{c}</text>
          </g>
        ))}
        {wTicks.map((w) => (
          <g key={w}>
            <line x1={plotLeft - 4} y1={wToY(w)} x2={plotLeft} y2={wToY(w)} stroke={CONTOUR} strokeWidth="1" />
            <text x={plotLeft - 7} y={wToY(w) + 3} textAnchor="end" fontSize="7" fill={MUTED} fontFamily="JetBrains Mono, monospace">{w}</text>
          </g>
        ))}
        <text x={(plotLeft + plotRight) / 2} y={plotBottom + 26} textAnchor="middle" fontSize="8" fill={MUTED} fontFamily="JetBrains Mono, monospace">CG (in)</text>
        <text x={12} y={(plotTop + plotBottom) / 2} textAnchor="middle" fontSize="8" fill={MUTED} fontFamily="JetBrains Mono, monospace" transform={`rotate(-90 12 ${(plotTop + plotBottom) / 2})`}>WEIGHT (lb)</text>

        {/* envelope */}
        <polygon points={polygonPoints} fill={CHART_BLUE} fillOpacity="0.12" stroke={CHART_BLUE} strokeWidth="1.5" />

        {/* plotted point */}
        {showPoint && (
          <circle cx={cgToX(cg)} cy={wToY(weight)} r="5" fill={pointOk ? OLIVE : ERROR} stroke={INK} strokeWidth="1" />
        )}
      </svg>
      <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Practice-only envelope — shape and limits are illustrative, not real POH data.</div>
    </div>
  );
}

export function ApproachGuide({ steps }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="mono"
        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: CHART_BLUE, background: "none", border: `1px solid ${CHART_BLUE_66}`, borderRadius: 3, padding: "6px 10px", cursor: "pointer" }}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />} HOW TO APPROACH THIS
      </button>
      {open && (
        <ol style={{ margin: "10px 0 0", paddingLeft: 20, fontSize: 12, color: INK, lineHeight: 1.7 }}>
          {steps.map((s, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{s}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

// Minimal sign-in/sign-out affordance backed by Azure SWA's built-in auth. Purely
// identity/display for now — not wired to where progress is stored. Degrades cleanly
// wherever /.auth/* doesn't exist (see lib/auth.js): `user` will just be null.
export function AuthStatus({ user }) {
  if (!user) {
    return (
      <a
        href={loginUrl("github")}
        className="mono"
        style={{ fontSize: 11, color: MUTED, textDecoration: "underline" }}
      >
        SIGN IN
      </a>
    );
  }
  return (
    <span className="mono" style={{ fontSize: 11, color: MUTED, display: "flex", alignItems: "center", gap: 8 }}>
      {user.username}
      <a href={logoutUrl()} style={{ color: MUTED, textDecoration: "underline" }}>
        SIGN OUT
      </a>
    </span>
  );
}
