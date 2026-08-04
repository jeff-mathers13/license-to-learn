// The active quiz-question screen, including the inline Explain toggle.

import { useState } from "react";
import { INK, MUTED, PAPER, CONTOUR, MAGENTA, OLIVE, ERROR, ERROR_BG, SUCCESS_BG, ON_ACCENT } from "../theme";

export function QuizCard({ category, question, index, total, answer, onSubmit, onNext, onSaveExit, onFinishNow, hasMissed }) {
  const [showExplanation, setShowExplanation] = useState(false);
  const isCorrectAnswer = answer !== null && answer === question.correct;

  return (
    <div className="paper-panel" style={{ borderRadius: 4, padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <span className="mono" style={{ fontSize: 11, color: MAGENTA }}>{category.toUpperCase()}</span>
        <span className="mono" style={{ fontSize: 11, color: MUTED }}>{index + 1} / {total}</span>
      </div>
      <div className="chart-head" style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, lineHeight: 1.45 }}>{question.q}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correct;
          const isChosen = i === answer;
          let bg = PAPER, border = CONTOUR, color = INK;
          if (answer !== null) {
            if (isCorrect) { bg = SUCCESS_BG; border = OLIVE; color = OLIVE; }
            else if (isChosen) { bg = ERROR_BG; border = ERROR; color = ERROR; }
          }
          return (
            <button
              key={i}
              onClick={() => onSubmit(i)}
              disabled={answer !== null}
              style={{ textAlign: "left", padding: "12px 16px", borderRadius: 4, border: `1px solid ${border}`, background: bg, color, fontSize: 13, cursor: answer === null ? "pointer" : "default" }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {answer !== null && (
        <div style={{ marginTop: 14 }}>
          <button
            onClick={() => setShowExplanation((s) => !s)}
            className="mono"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: isCorrectAnswer ? OLIVE : ERROR,
              background: "none",
              border: `1px solid ${isCorrectAnswer ? OLIVE : ERROR}`,
              borderRadius: 3,
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            {showExplanation ? "HIDE EXPLANATION" : "EXPLAIN"}
          </button>
          {showExplanation && question.explanation && (
            <div
              style={{
                marginTop: 10,
                background: isCorrectAnswer ? SUCCESS_BG : ERROR_BG,
                border: `1px solid ${isCorrectAnswer ? OLIVE : ERROR}`,
                borderRadius: 4,
                padding: "12px 16px",
                fontSize: 13,
                color: INK,
                lineHeight: 1.55,
              }}
            >
              {question.explanation}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        {answer !== null && (
          <button
            onClick={onNext}
            className="chart-head"
            style={{ background: MAGENTA, color: ON_ACCENT, border: "none", borderRadius: 4, padding: "12px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            {index + 1 < total ? "NEXT QUESTION →" : "FINISH"}
          </button>
        )}
        <button
          onClick={onSaveExit}
          className="mono"
          style={{ fontSize: 11, color: MUTED, background: "none", border: `1px solid ${CONTOUR}`, borderRadius: 3, padding: "8px 12px", cursor: "pointer" }}
        >
          SAVE &amp; EXIT
        </button>
        {hasMissed && (
          <button
            onClick={onFinishNow}
            className="mono"
            style={{ fontSize: 11, color: OLIVE, background: "none", border: `1px solid ${OLIVE}`, borderRadius: 3, padding: "8px 12px", cursor: "pointer", marginLeft: "auto" }}
          >
            SKIP TO REVIEW →
          </button>
        )}
      </div>
    </div>
  );
}
