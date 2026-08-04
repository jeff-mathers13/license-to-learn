// Setup / active-taking / results screens for the mock exam mode.

import { useState } from "react";
import { Clock, Flag, AlertTriangle } from "lucide-react";
import {
  INK, MUTED, PAPER, CONTOUR, MAGENTA, CHART_BLUE, OLIVE,
  ERROR, ERROR_BG, SUCCESS_BG, ON_ACCENT, SURFACE, NAV_DOT_BG, SECTION_TRACK_BG,
} from "../theme";
import { PASS_MARK, OFFICIAL_SECTIONS } from "../data/syllabus";
import { EXAM_LENGTH_OPTIONS, scoreExamBySection } from "../lib/mockExam";
import { categoryFromId } from "../data/questions";

export function MockExamSetup({ history, onStart }) {
  return (
    <div>
      <div className="chart-head" style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>MOCK EXAM</div>
      <div style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.6 }}>
        Simulates the real PPAER format: questions drawn proportionally across all 4 official sections, a real countdown timer, no feedback until you submit, and a final pass/fail breakdown at 60% overall and 60% per section.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {EXAM_LENGTH_OPTIONS.map((opt) => (
          <button
            key={opt.length}
            onClick={() => onStart(opt.length)}
            className="paper-panel"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 4, padding: "16px 20px", color: INK, cursor: "pointer", textAlign: "left" }}
          >
            <div>
              <span className="chart-head" style={{ fontWeight: 700, fontSize: 15 }}>{opt.length} Questions</span>
              <div className="mono" style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                {opt.length === 100 ? "FULL-LENGTH — MATCHES THE REAL EXAM" : "SCALED PRACTICE SESSION"}
              </div>
            </div>
            <span className="mono" style={{ fontSize: 13, color: OLIVE, fontWeight: 700 }}>{opt.minutes} MIN</span>
          </button>
        ))}
      </div>

      {history.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize: 11, color: MUTED, letterSpacing: 0.5, marginBottom: 8 }}>PAST ATTEMPTS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...history].reverse().slice(0, 5).map((h, i) => {
              const passed = h.overallPct >= PASS_MARK;
              const date = h.completedAt ? new Date(h.completedAt).toLocaleDateString() : "—";
              return (
                <div key={i} className="paper-panel" style={{ borderRadius: 4, padding: "10px 14px", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: MUTED }}>{date} · {h.length}Q</span>
                  <span className="mono" style={{ fontWeight: 700, color: passed ? OLIVE : ERROR }}>{h.overallPct}% {passed ? "PASS" : "FAIL"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function MockExamActive({ exam, questionIdx, setQuestionIdx, onAnswer, onToggleFlag, submitConfirm, setSubmitConfirm, onSubmit }) {
  const remainingSeconds = Math.max(0, Math.round(exam.durationMinutes * 60 - (Date.now() - Date.parse(exam.startedAt)) / 1000));
  const mm = Math.floor(remainingSeconds / 60);
  const ss = remainingSeconds % 60;
  const lowTime = remainingSeconds <= 300; // last 5 minutes

  const question = exam.questions[questionIdx];
  const answeredCount = Object.keys(exam.answers).length;
  const isFlagged = exam.flagged.includes(question.id);
  const chosen = exam.answers[question.id];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="mono" style={{ fontSize: 12, color: MUTED }}>
          Q {questionIdx + 1} / {exam.questions.length} · {answeredCount} answered
        </div>
        <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: lowTime ? ERROR : INK, display: "flex", alignItems: "center", gap: 5 }}>
          <Clock size={14} color={lowTime ? ERROR : MUTED} />
          {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </div>
      </div>

      {/* Question navigator grid */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16, maxHeight: 92, overflowY: "auto", padding: 2 }}>
        {exam.questions.map((q, i) => {
          const answered = exam.answers[q.id] !== undefined;
          const flagged = exam.flagged.includes(q.id);
          const isCurrent = i === questionIdx;
          return (
            <button
              key={q.id}
              onClick={() => setQuestionIdx(i)}
              className="mono"
              title={flagged ? "Flagged for review" : answered ? "Answered" : "Not answered"}
              style={{
                width: 26,
                height: 26,
                fontSize: 10,
                fontWeight: isCurrent ? 700 : 500,
                borderRadius: 3,
                cursor: "pointer",
                border: isCurrent ? `2px solid ${MAGENTA}` : flagged ? `1px solid ${ERROR}` : `1px solid ${CONTOUR}`,
                background: answered ? (flagged ? ERROR_BG : SUCCESS_BG) : SURFACE,
                color: INK,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="paper-panel" style={{ borderRadius: 4, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 20 }}>
          <div className="chart-head" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.45 }}>{question.q}</div>
          <button
            onClick={() => onToggleFlag(question.id)}
            title="Flag for review"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}
          >
            <Flag size={20} color={isFlagged ? ERROR : CONTOUR} fill={isFlagged ? ERROR : "none"} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {question.options.map((opt, i) => {
            const isChosen = i === chosen;
            return (
              <button
                key={i}
                onClick={() => onAnswer(question.id, i)}
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  borderRadius: 4,
                  border: `1px solid ${isChosen ? MAGENTA : CONTOUR}`,
                  background: isChosen ? NAV_DOT_BG : PAPER,
                  color: INK,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setQuestionIdx(Math.max(0, questionIdx - 1))}
            disabled={questionIdx === 0}
            className="mono"
            style={{ fontSize: 12, color: questionIdx === 0 ? MUTED : INK, background: "none", border: `1px solid ${CONTOUR}`, borderRadius: 4, padding: "10px 16px", cursor: questionIdx === 0 ? "default" : "pointer", opacity: questionIdx === 0 ? 0.5 : 1 }}
          >
            ← PREV
          </button>
          <button
            onClick={() => setQuestionIdx(Math.min(exam.questions.length - 1, questionIdx + 1))}
            disabled={questionIdx === exam.questions.length - 1}
            className="mono"
            style={{ fontSize: 12, color: questionIdx === exam.questions.length - 1 ? MUTED : INK, background: "none", border: `1px solid ${CONTOUR}`, borderRadius: 4, padding: "10px 16px", cursor: questionIdx === exam.questions.length - 1 ? "default" : "pointer", opacity: questionIdx === exam.questions.length - 1 ? 0.5 : 1 }}
          >
            NEXT →
          </button>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        {!submitConfirm ? (
          <button
            onClick={() => setSubmitConfirm(true)}
            className="chart-head"
            style={{ width: "100%", background: MAGENTA, color: ON_ACCENT, border: "none", borderRadius: 4, padding: "14px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            SUBMIT EXAM
          </button>
        ) : (
          <div className="paper-panel" style={{ borderRadius: 4, padding: 18, border: `1px solid ${ERROR}` }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <AlertTriangle size={18} color={ERROR} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, color: INK, lineHeight: 1.5 }}>
                {answeredCount} of {exam.questions.length} answered
                {exam.flagged.length > 0 && `, ${exam.flagged.length} flagged for review`}. Submitting ends the exam — this can't be undone.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onSubmit}
                className="mono"
                style={{ flex: 1, fontSize: 12, fontWeight: 700, color: ON_ACCENT, background: ERROR, border: "none", borderRadius: 4, padding: "10px 16px", cursor: "pointer" }}
              >
                CONFIRM SUBMIT
              </button>
              <button
                onClick={() => setSubmitConfirm(false)}
                className="mono"
                style={{ flex: 1, fontSize: 12, color: MUTED, background: "none", border: `1px solid ${CONTOUR}`, borderRadius: 4, padding: "10px 16px", cursor: "pointer" }}
              >
                KEEP WORKING
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MockExamResults({ exam, onNewExam }) {
  const [showReview, setShowReview] = useState(false);
  const sectionScores = scoreExamBySection(exam);
  const totals = Object.values(sectionScores).reduce((a, s) => ({ correct: a.correct + s.correct, total: a.total + s.total }), { correct: 0, total: 0 });
  const overallPct = totals.total ? Math.round((totals.correct / totals.total) * 100) : 0;
  const overallPass = overallPct >= PASS_MARK;
  const allSectionsPass = Object.values(sectionScores).every((s) => s.total === 0 || Math.round((s.correct / s.total) * 100) >= PASS_MARK);
  const fullyPassed = overallPass && allSectionsPass;

  return (
    <div>
      <div className="chart-head" style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>EXAM RESULTS</div>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 20 }}>
        {exam.length} questions · submitted {exam.submittedAt ? new Date(exam.submittedAt).toLocaleString() : ""}
      </div>

      <div
        className="paper-panel"
        style={{ borderRadius: 4, padding: 24, marginBottom: 16, textAlign: "center", border: `2px solid ${fullyPassed ? OLIVE : ERROR}` }}
      >
        <div className="mono" style={{ fontSize: 11, color: MUTED, letterSpacing: 0.5, marginBottom: 6 }}>OVERALL SCORE</div>
        <div className="chart-head" style={{ fontSize: 40, fontWeight: 700, color: fullyPassed ? OLIVE : ERROR }}>{overallPct}%</div>
        <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: fullyPassed ? OLIVE : ERROR, marginTop: 4 }}>
          {fullyPassed ? "PASS" : "FAIL"}
        </div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 8 }}>{totals.correct} / {totals.total} correct</div>
        {overallPass && !allSectionsPass && (
          <div style={{ fontSize: 11, color: ERROR, marginTop: 8 }}>Overall met 60%, but at least one section fell short — the real exam requires 60% in every section.</div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {OFFICIAL_SECTIONS.map((section) => {
          const s = sectionScores[section];
          const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
          const pass = pct >= PASS_MARK;
          return (
            <div key={section} className="paper-panel" style={{ borderRadius: 4, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13 }}>{section}</span>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: pass ? OLIVE : ERROR }}>{pct}% ({s.correct}/{s.total})</span>
              </div>
              <div style={{ height: 6, background: SECTION_TRACK_BG, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: pass ? OLIVE : ERROR, transition: "width 0.3s ease" }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setShowReview((s) => !s)}
          className="mono"
          style={{ flex: 1, fontSize: 12, color: CHART_BLUE, background: "none", border: `1px solid ${CHART_BLUE}`, borderRadius: 4, padding: "12px 16px", cursor: "pointer" }}
        >
          {showReview ? "HIDE FULL REVIEW" : "SHOW FULL REVIEW"}
        </button>
        <button
          onClick={onNewExam}
          className="chart-head"
          style={{ flex: 1, background: MAGENTA, color: ON_ACCENT, border: "none", borderRadius: 4, padding: "12px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          NEW EXAM
        </button>
      </div>

      {showReview && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {exam.questions.map((q, i) => {
            const chosen = exam.answers[q.id];
            const answered = chosen !== undefined;
            const correct = answered && chosen === q.correct;
            return (
              <div key={q.id} className="paper-panel" style={{ borderRadius: 4, padding: "14px 16px", borderLeft: `4px solid ${correct ? OLIVE : ERROR}` }}>
                <div className="mono" style={{ fontSize: 10, color: MUTED, marginBottom: 6 }}>
                  Q{i + 1} · {categoryFromId(q.id)} {exam.flagged.includes(q.id) && "· FLAGGED"}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{q.q}</div>
                <div style={{ fontSize: 12, color: INK, marginBottom: 4 }}>
                  Your answer: <strong style={{ color: answered ? (correct ? OLIVE : ERROR) : MUTED }}>{answered ? q.options[chosen] : "Not answered"}</strong>
                </div>
                {!correct && (
                  <div style={{ fontSize: 12, color: OLIVE, marginBottom: 6 }}>Correct answer: <strong>{q.options[q.correct]}</strong></div>
                )}
                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{q.explanation}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
