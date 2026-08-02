import { useState, useEffect, useCallback, useRef, Component } from "react";
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronRight, Target, BookOpen, RotateCcw, AlertTriangle } from "lucide-react";
import { INK, MUTED, PAPER, PANEL, CONTOUR, MAGENTA, CHART_BLUE, OLIVE } from "./theme";
import { QUIZ_BANK, shuffleArray, shuffleQuestionOptions } from "./data/questions";
import { SYLLABUS, CATEGORY_TO_SECTION, OFFICIAL_SECTIONS, PASS_MARK } from "./data/syllabus";
import { storageAdapter, STORAGE_KEY, configureRemoteUser, clearRemoteUser, AuthExpiredError } from "./lib/storage";
import { serializePausedSession, rehydratePausedSession, pausedLength, latestAttempt, previousAttempt, attemptPct, computeSectionScores } from "./lib/quizSession";
import { genMockExam, serializeExam, rehydrateExam, scoreExamBySection } from "./lib/mockExam";
import { BottomTabBar, Stat, AuthStatus } from "./components/shared";
import { QuizCard } from "./components/QuizCard";
import { WindTriangleCalc, DensityAltitudeCalc, WeightBalanceCalc, PerformanceChartCalc, FuelPlanningCalc, WeatherChartCalc, MetarTafCalc, CrosswindCalc, TasCalc, CGShiftCalc, InstrumentCalc } from "./components/Calculators";
import { GlossaryPage } from "./components/Glossary";
import { MockExamSetup, MockExamActive, MockExamResults } from "./components/MockExam";
import { useAuth } from "./lib/useAuth";

function PPLGroundSchoolSectionalInner() {
  // Identity only — see lib/auth.js. Resolves to null wherever the SWA auth runtime
  // isn't present (local `vite dev`, or before this is deployed to Azure), so this is
  // always safe to call regardless of environment or storage backend in use.
  const { user: authUser, checked: authChecked } = useAuth();

  const [progress, setProgress] = useState({});
  const [openLeg, setOpenLeg] = useState(null);
  const [openReadings, setOpenReadings] = useState({});
  const [examDate, setExamDate] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("syllabus");
  const [quizCategory, setQuizCategory] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [missedQuestions, setMissedQuestions] = useState([]);
  const [sessionTotal, setSessionTotal] = useState(0);
  // True once the current session has been written to quizAttempts, so it can't be
  // mirrored back into pausedQuizzes and counted a second time.
  const [sessionRecorded, setSessionRecorded] = useState(false);
  const [pausedQuizzes, setPausedQuizzes] = useState({}); // { [category]: { questions, index, answer, missed, sessionTotal } }
  const [calcCategory, setCalcCategory] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState({}); // { [category]: [{ completedAt, correct, total }] }
  const [mockExam, setMockExam] = useState(null); // current in-progress or just-submitted exam, or null
  const [mockExamHistory, setMockExamHistory] = useState([]); // [{ completedAt, length, overallPct, sectionScores }]
  const [examQuestionIdx, setExamQuestionIdx] = useState(0);
  const [examSubmitConfirm, setExamSubmitConfirm] = useState(false);
  const [examTick, setExamTick] = useState(0); // forces re-render every second so the countdown updates
  const [examLeaveTarget, setExamLeaveTarget] = useState(null); // "syllabus" | "quiz" | "calc" | null — pending tab-bar nav away from an in-progress exam
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error | unavailable
  // Gates the persist effect alongside `loaded`. Stays false while a signed-in user with
  // pre-existing local progress is deciding whether to import it, so an incidental state
  // change (e.g. the active-quiz mirror effect below) can't silently push that data to
  // their account before they've actually chosen to. See migrationOffer.
  const [migrationResolved, setMigrationResolved] = useState(true);
  // { payload } once a signed-in user is found to have local progress their (empty) remote
  // account hasn't seen yet; null otherwise. Drives the import banner near the syllabus view.
  const [migrationOffer, setMigrationOffer] = useState(null);
  const configuredUserIdRef = useRef(undefined); // undefined = not yet configured this session

  useEffect(() => {
    if (!authChecked) return; // wait for the one-time /.auth/me check to resolve
    const targetUserId = authUser?.userId ?? null;

    // A different identity than whatever this session already loaded data for (e.g. signed
    // out and back in as someone else) — reload rather than hand-reset a dozen state slices.
    if (configuredUserIdRef.current !== undefined && configuredUserIdRef.current !== targetUserId && loaded) {
      window.location.reload();
      return;
    }
    configuredUserIdRef.current = targetUserId;

    if (targetUserId) configureRemoteUser(targetUserId);
    else clearRemoteUser();

    (async () => {
      if (!storageAdapter.available) {
        console.error("No persistent storage backend is available in this environment.");
        setSaveStatus("unavailable");
        setMigrationResolved(true);
        setLoaded(true);
        return;
      }
      try {
        const raw = await storageAdapter.get(STORAGE_KEY);
        const dismissedKey = targetUserId ? `migration-dismissed-${targetUserId}` : null;
        const alreadyDismissed = dismissedKey ? window.localStorage.getItem(dismissedKey) === "1" : true;
        let localRaw = null;
        if (targetUserId && !raw && !alreadyDismissed) {
          try {
            localRaw = window.localStorage.getItem(STORAGE_KEY);
          } catch {
            localRaw = null;
          }
        }
        const sourceRaw = localRaw || raw;
        if (sourceRaw) {
          const parsed = JSON.parse(sourceRaw);
          setProgress(parsed.progress || {});
          setExamDate(parsed.examDate || "");
          if (parsed.quizAttempts) {
            setQuizAttempts(parsed.quizAttempts);
          } else if (parsed.quizScores) {
            // Migrate the old lifetime-cumulative format. The old totals can't be split back
            // into individual attempts, so they're preserved as one historical entry.
            const migrated = {};
            Object.entries(parsed.quizScores).forEach(([cat, s]) => {
              if (s && s.total > 0) {
                migrated[cat] = [{ completedAt: null, correct: s.correct, total: s.total, migrated: true }];
              }
            });
            setQuizAttempts(migrated);
          }
          // Normalize paused quizzes to the compact reference format on load, whichever
          // format they were saved in. Anything that can't be restored is dropped.
          const rawPaused =
            parsed.pausedQuizzes ||
            (parsed.quizProgress ? { [parsed.quizProgress.category]: parsed.quizProgress } : null);
          if (rawPaused) {
            const normalized = {};
            Object.entries(rawPaused).forEach(([cat, p]) => {
              const session = rehydratePausedSession(p);
              if (session) normalized[cat] = serializePausedSession(session);
            });
            setPausedQuizzes(normalized);
          }
          if (parsed.mockExam) {
            const exam = rehydrateExam(parsed.mockExam);
            setMockExam(exam);
          }
          if (Array.isArray(parsed.mockExamHistory)) {
            setMockExamHistory(parsed.mockExamHistory);
          }
        }
        if (localRaw) {
          // Non-trivial local progress found with nothing in this (empty) remote account yet.
          setMigrationOffer({ dismissedKey });
          setMigrationResolved(false);
        } else {
          setMigrationResolved(true);
        }
      } catch (e) {
        // A corrupt saved blob shouldn't brick the app — start fresh and log it.
        console.error("Failed to parse saved state; starting fresh:", e?.message || e);
        setMigrationResolved(true);
      }
      setLoaded(true);
    })();
    // `loaded` is read (to distinguish "already loaded once" from initial mount) but
    // deliberately excluded here — it's set at the end of this same effect, and including
    // it would re-fire this whole load a second time on every mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, authUser?.userId]);

  const resolveMigration = (mode) => {
    if (migrationOffer?.dismissedKey) {
      try {
        window.localStorage.setItem(migrationOffer.dismissedKey, "1");
      } catch {
        // best-effort; worst case the banner reappears next load
      }
    }
    if (mode === "fresh") {
      setProgress({});
      setExamDate("");
      setQuizAttempts({});
      setPausedQuizzes({});
      setMockExam(null);
      setMockExamHistory([]);
    }
    setMigrationOffer(null);
    setMigrationResolved(true);
  };

  const persistTimer = useRef(null);
  const persistSeq = useRef(0);
  const lastPayload = useRef(null);

  const writeToStorage = useCallback(async (next, mySeq, attempt = 1) => {
    try {
      const ok = await storageAdapter.set(STORAGE_KEY, JSON.stringify(next));
      if (mySeq !== persistSeq.current) return; // superseded by a newer save
      if (!ok) {
        console.error(`Storage set failed on attempt ${attempt}.`, { backend: storageAdapter.backend, payloadBytes: JSON.stringify(next).length });
        if (attempt < 3) {
          setTimeout(() => writeToStorage(next, mySeq, attempt + 1), attempt * 1000);
        } else {
          setSaveStatus("error");
        }
      } else {
        setSaveStatus("saved");
      }
    } catch (e) {
      if (mySeq !== persistSeq.current) return;
      if (e instanceof AuthExpiredError) {
        // No amount of retrying fixes an expired session — surface the error immediately
        // instead of burning the usual 3 backoff attempts on something that can't succeed.
        console.error("Storage write failed: signed-in session expired.");
        setSaveStatus("error");
        return;
      }
      console.error(`Storage error on attempt ${attempt} (backend: ${storageAdapter.backend}):`, e);
      if (attempt < 3) {
        setTimeout(() => writeToStorage(next, mySeq, attempt + 1), attempt * 1000);
      } else {
        setSaveStatus("error");
      }
    }
  }, []);

  const persist = useCallback(
    (next) => {
      if (!storageAdapter.available) {
        setSaveStatus("unavailable");
        return;
      }
      lastPayload.current = next;
      setSaveStatus("saving");
      if (persistTimer.current) clearTimeout(persistTimer.current);
      const mySeq = ++persistSeq.current;
      persistTimer.current = setTimeout(() => writeToStorage(next, mySeq, 1), 400);
    },
    [writeToStorage]
  );

  const retryNow = () => {
    if (lastPayload.current) {
      const mySeq = ++persistSeq.current;
      setSaveStatus("saving");
      writeToStorage(lastPayload.current, mySeq, 1);
    }
  };

  useEffect(() => {
    if (!loaded || !migrationResolved) return;
    persist({ progress, examDate, quizAttempts, pausedQuizzes, mockExam: serializeExam(mockExam), mockExamHistory });
  }, [progress, examDate, quizAttempts, pausedQuizzes, mockExam, mockExamHistory, loaded, migrationResolved, persist]);

  const allTopics = SYLLABUS.flatMap((w) => w.topics);
  const doneCount = allTopics.filter((t) => progress[t.id]?.done).length;
  const totalCount = allTopics.length;
  const overallPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const daysToExam = examDate
    ? Math.max(0, Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const toggleDone = (id) => {
    setProgress((prev) => ({ ...prev, [id]: { ...prev[id], done: !prev[id]?.done } }));
  };

  // Continuously mirror the currently-active quiz attempt into pausedQuizzes so progress
  // is never lost even without an explicit Save & Exit, while leaving other categories' paused attempts untouched.
  useEffect(() => {
    if (!loaded) return;
    if (!quizCategory || view === "review" || sessionRecorded) return;
    setPausedQuizzes((prev) => ({
      ...prev,
      [quizCategory]: serializePausedSession({
        questions: quizQuestions,
        index: quizIndex,
        answer: quizAnswer,
        missed: missedQuestions,
        sessionTotal,
      }),
    }));
  }, [quizCategory, quizQuestions, quizIndex, quizAnswer, missedQuestions, sessionTotal, view, loaded, sessionRecorded]);

  // Ticks once per second while an exam is in progress, purely to force a re-render so the
  // countdown display stays live. The remaining time itself is always computed from wall-clock
  // time (startedAt + duration) wherever it's displayed, never a naive decrementing counter —
  // so it can't drift if the tab is backgrounded, and stays accurate even across a reload.
  useEffect(() => {
    if (!mockExam || mockExam.submitted) return;
    const interval = setInterval(() => setExamTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [mockExam?.submitted, mockExam?.startedAt]);

  // Auto-submits the exam the moment time runs out, whether or not the person is looking at it.
  useEffect(() => {
    if (!mockExam || mockExam.submitted) return;
    const remaining = mockExam.durationMinutes * 60 - (Date.now() - Date.parse(mockExam.startedAt)) / 1000;
    if (remaining <= 0) submitExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examTick, mockExam]);

  const toggleReading = (id) => {
    setOpenReadings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startQuiz = (category) => {
    const restored = rehydratePausedSession(pausedQuizzes[category]);
    setQuizCategory(category);
    if (restored) {
      setQuizQuestions(restored.questions);
      setQuizIndex(restored.index);
      setQuizAnswer(restored.answer);
      setMissedQuestions(restored.missed);
      setSessionTotal(restored.sessionTotal);
    } else {
      setQuizQuestions(shuffleArray(QUIZ_BANK[category].map(shuffleQuestionOptions)));
      setQuizIndex(0);
      setQuizAnswer(null);
      setMissedQuestions([]);
      setSessionTotal(0);
    }
    setSessionRecorded(false);
    setView("quiz");
  };

  const submitAnswer = (optionIdx) => {
    if (quizAnswer !== null) return;
    setQuizAnswer(optionIdx);
    const question = quizQuestions[quizIndex];
    const isCorrect = optionIdx === question.correct;
    if (!isCorrect) {
      setMissedQuestions((prev) => [...prev, { ...question, chosenIndex: optionIdx }]);
    }
    setSessionTotal((prev) => prev + 1);
  };

  // Closes out the current attempt: appends it to this category's history and clears the
  // paused entry, so an attempt can never be counted twice by resuming and finishing again.
  const recordAttempt = (category) => {
    if (!category || sessionTotal === 0 || sessionRecorded) return;
    setSessionRecorded(true);
    const correct = sessionTotal - missedQuestions.length;
    setQuizAttempts((prev) => {
      const history = prev[category] || [];
      return {
        ...prev,
        [category]: [...history, { completedAt: new Date().toISOString(), correct, total: sessionTotal }],
      };
    });
    setPausedQuizzes((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  };

  const nextQuestion = () => {
    setQuizAnswer(null);
    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex(quizIndex + 1);
    } else {
      recordAttempt(quizCategory);
      setView("review");
    }
  };

  const finishReview = () => {
    setView("syllabus");
    setQuizCategory(null);
    setMissedQuestions([]);
    setSessionTotal(0);
    setSessionRecorded(false);
  };

  // Lets the person stop mid-quiz and jump straight to reviewing whatever they've answered so far.
  // The partial attempt still counts — it reflects real performance on the questions seen.
  const finishNow = () => {
    recordAttempt(quizCategory);
    setView("review");
  };

  // Leaves the quiz in place (still in progress, mirrored into pausedQuizzes) and returns to the syllabus.
  const saveAndExit = () => {
    setView("syllabus");
    setQuizCategory(null);
  };

  const discardPaused = (category) => {
    setPausedQuizzes((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  };

  const startExam = (length) => {
    setMockExam(genMockExam(length));
    setExamQuestionIdx(0);
    setExamSubmitConfirm(false);
  };

  const answerExamQuestion = (questionId, chosenIndex) => {
    setMockExam((prev) => (prev ? { ...prev, answers: { ...prev.answers, [questionId]: chosenIndex } } : prev));
  };

  const toggleExamFlag = (questionId) => {
    setMockExam((prev) => {
      if (!prev) return prev;
      const flagged = prev.flagged.includes(questionId) ? prev.flagged.filter((id) => id !== questionId) : [...prev.flagged, questionId];
      return { ...prev, flagged };
    });
  };

  const submitExam = () => {
    setMockExam((prev) => {
      if (!prev || prev.submitted) return prev;
      const submitted = { ...prev, submitted: true, submittedAt: new Date().toISOString() };
      const sectionScores = scoreExamBySection(submitted);
      const totals = Object.values(sectionScores).reduce((a, s) => ({ correct: a.correct + s.correct, total: a.total + s.total }), { correct: 0, total: 0 });
      const overallPct = totals.total ? Math.round((totals.correct / totals.total) * 100) : 0;
      setMockExamHistory((hist) => [...hist, { completedAt: submitted.submittedAt, length: submitted.length, overallPct, sectionScores }]);
      return submitted;
    });
    setExamSubmitConfirm(false);
  };

  const newExam = () => {
    setMockExam(null);
    setExamQuestionIdx(0);
    setExamSubmitConfirm(false);
  };

  // Named so both direct taps and a confirmed tab-bar leave can call the same logic.
  const goHome = () => {
    // Leaving a finished review via the tab bar should tidy up the session the
    // same way the Done button does, rather than leaving it half-alive.
    if (sessionRecorded) {
      setQuizCategory(null);
      setMissedQuestions([]);
      setSessionTotal(0);
      setSessionRecorded(false);
    }
    setView("syllabus");
  };
  const goQuiz = () => setView("quiz");
  const goCalc = () => {
    setView("calc");
    setCalcCategory(null);
  };

  // Gates tab-bar navigation behind a confirmation only while an exam is actively in
  // progress and being viewed — moving between Quiz/Calc/Home while an exam merely sits
  // paused in the background (not currently on screen) doesn't need to nag every tap.
  const requestNav = (target, navFn) => {
    const midExam = view === "exam" && mockExam && !mockExam.submitted;
    if (midExam) {
      setExamLeaveTarget(target);
    } else {
      navFn();
    }
  };

  const confirmExamLeave = () => {
    const target = examLeaveTarget;
    setExamLeaveTarget(null);
    if (target === "syllabus") goHome();
    else if (target === "quiz") goQuiz();
    else if (target === "calc") goCalc();
  };

  const resetAll = async () => {
    setQuizAttempts({});
    setQuizCategory(null);
    setQuizQuestions([]);
    setQuizIndex(0);
    setQuizAnswer(null);
    setMissedQuestions([]);
    setSessionTotal(0);
    setSessionRecorded(false);
    setPausedQuizzes({});
  };

  // Route-line signature element: 4 checkpoints (one per leg), plane position by overall %.
  const routeStart = 60, routeEnd = 840;
  const legCheckpointX = (() => {
    let cumulative = 0;
    return SYLLABUS.map((leg) => {
      cumulative += leg.topics.length;
      return routeStart + (cumulative / totalCount) * (routeEnd - routeStart);
    });
  })();
  const planeX = routeStart + (overallPct / 100) * (routeEnd - routeStart);
  const legComplete = (w) => w.topics.every((t) => progress[t.id]?.done);

  const sectionScores = computeSectionScores(quizAttempts);
  const overallQuiz = Object.keys(quizAttempts).reduce(
    (acc, cat) => {
      const latest = latestAttempt(quizAttempts, cat);
      return latest ? { correct: acc.correct + latest.correct, total: acc.total + latest.total } : acc;
    },
    { correct: 0, total: 0 }
  );
  const overallQuizPct = overallQuiz.total ? Math.round((overallQuiz.correct / overallQuiz.total) * 100) : null;

  // Auto-derived topic readiness: reflects the most recent attempt at the topic's quiz
  // category, so a student who has since improved isn't held back by earlier attempts.
  const getTopicReadiness = (topic) => {
    if (!topic.quizCategory) return { status: "n/a", pct: null };
    const pct = attemptPct(latestAttempt(quizAttempts, topic.quizCategory));
    if (pct === null) return { status: "no-data", pct: null };
    return { status: pct >= PASS_MARK ? "pass" : "fail", pct };
  };
  const topicsAtRisk = allTopics.filter((t) => getTopicReadiness(t).status === "fail").length;
  const totalQuizQuestions = Object.values(QUIZ_BANK).reduce((a, arr) => a + arr.length, 0);
  const totalQuizCategories = Object.keys(QUIZ_BANK).length;

  return (
    <div style={{ minHeight: "100vh", background: PAPER, color: INK, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bitter:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap');
        .chart-head { font-family: 'Bitter', serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .topic-row:hover { background: #EFE2B9; }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; }
        .paper-panel { background: ${PANEL}; border: 1px solid ${CONTOUR}55; }
      `}</style>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 20px 100px" }}>
        {/* Persistent save-status + auth row */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 14, paddingTop: 10 }}>
          {(saveStatus === "saving" || saveStatus === "saved") && (
            <span className="mono" style={{ fontSize: 11, color: MUTED }}>
              {saveStatus === "saving" ? "SAVING…" : "SAVED"}
            </span>
          )}
          <AuthStatus user={authUser} />
        </div>

        {saveStatus === "unavailable" && (
          <div style={{ background: "#F5E3D6", border: "1px solid #B5651D", borderRadius: 4, padding: "12px 16px", margin: "16px 0", fontSize: 12, color: "#B5651D" }}>
            Persistent storage isn't available in this environment, so progress won't be saved between sessions. This can happen in private/incognito browsing or when the browser blocks site storage — try a regular browser window.
          </div>
        )}
        {saveStatus === "error" && (
          <div style={{ background: "#F5E3D6", border: "1px solid #B5651D", borderRadius: 4, padding: "12px 16px", margin: "16px 0", fontSize: 12, color: "#B5651D", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span>Unable to log this leg — your last change may not have made it to the flight log. Check the browser console for details.</span>
            <button
              onClick={retryNow}
              className="mono"
              style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "#B5651D", background: "none", border: "1px solid #B5651D", borderRadius: 3, padding: "5px 10px", cursor: "pointer" }}
            >
              RETRY NOW
            </button>
          </div>
        )}

        {view === "syllabus" && (
          <FullbleedHero
            doneCount={doneCount}
            totalCount={totalCount}
            legCheckpointX={legCheckpointX}
            planeX={planeX}
            legComplete={legComplete}
          />
        )}

        {view === "syllabus" && <div style={{ height: 20 }} />}

        {view === "syllabus" && (
        <div className="paper-panel" style={{ borderRadius: 4, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
            <span className="chart-head" style={{ fontSize: 17, fontWeight: 700 }}>EXAM READINESS</span>
            <span className="mono" style={{ fontSize: 11, color: MUTED }}>PPAER REQUIRES 60% OVERALL + 60% PER SECTION</span>
            {overallQuizPct !== null && (
              <span
                className="mono"
                style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: overallQuizPct >= PASS_MARK ? OLIVE : "#B5651D" }}
              >
                OVERALL {overallQuizPct}%
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {OFFICIAL_SECTIONS.map((section) => {
              const s = sectionScores[section];
              const pct = s.total ? Math.round((s.correct / s.total) * 100) : null;
              const attempted = s.total > 0;
              const passed = attempted && pct >= PASS_MARK;
              const barColor = !attempted ? CONTOUR : passed ? OLIVE : "#B5651D";
              return (
                <div key={section}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12 }}>{section}</span>
                    <span className="mono" style={{ fontSize: 11, color: barColor }}>
                      {attempted ? `${pct}% (${s.correct}/${s.total})` : "not attempted"}
                    </span>
                  </div>
                  <div style={{ position: "relative", height: 8, background: "#00000012", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${attempted ? pct : 0}%`, background: barColor, transition: "width 0.3s ease" }} />
                    <div style={{ position: "absolute", left: `${PASS_MARK}%`, top: -2, bottom: -2, width: 2, background: INK }} title="60% pass mark" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {view !== "syllabus" && <div style={{ height: 24 }} />}

        {/* Breadcrumb navigation for non-home pages */}
        {(() => {
          // "instr: 'Instrument Reading'," removed from CALC_LABELS below while the calculator is hidden —
          // harmless to leave in an object literal, but kept out for consistency with the other 2 hidden spots.
          const CALC_LABELS = { wind: "Wind Triangle", density: "Density Altitude", wb: "Weight & Balance", fuel: "Fuel Planning", perf: "Performance Chart", wx: "Weather Chart", metar: "METAR/TAF Reading", xwind: "Crosswind Component", tas: "True Airspeed from CAS", cgshift: "CG Shift on Load Change" };
          let crumbs = [];
          if (view === "quiz" || view === "review") {
            crumbs.push({ label: "Home", onClick: () => setView("syllabus") });
            crumbs.push({
              label: "Practice Quiz",
              onClick: quizCategory
                ? () => {
                    setQuizCategory(null);
                    setView("quiz");
                  }
                : undefined,
            });
            if (quizCategory) {
              crumbs.push({ label: view === "review" ? `${quizCategory} — Results` : quizCategory });
            }
          } else if (view === "calc") {
            crumbs.push({ label: "Home", onClick: () => setView("syllabus") });
            crumbs.push({ label: "Practice Calculations", onClick: calcCategory ? () => setCalcCategory(null) : undefined });
            if (calcCategory) {
              crumbs.push({ label: CALC_LABELS[calcCategory] });
            }
          } else if (view === "glossary") {
            crumbs.push({ label: "Home", onClick: () => setView("syllabus") });
            crumbs.push({ label: "Glossary" });
          } else if (view === "exam") {
            // Mid-exam, the breadcrumb Home link goes through the same confirmation as the
            // tab bar instead of navigating instantly — leaving shouldn't be completely
            // frictionless, but a dead, unexplained link isn't better than a real confirm step.
            const midExam = mockExam && !mockExam.submitted;
            crumbs.push({ label: "Home", onClick: midExam ? () => requestNav("syllabus", goHome) : () => setView("syllabus") });
            crumbs.push({ label: "Mock Exam" });
          }
          if (crumbs.length === 0) return null;
          return (
            <div className="mono" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 18, fontSize: 12 }}>
              {crumbs.map((c, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {i > 0 && <span style={{ color: CONTOUR }}>/</span>}
                  {c.onClick ? (
                    <button
                      onClick={c.onClick}
                      className="mono"
                      style={{ background: "none", border: "none", color: CHART_BLUE, cursor: "pointer", padding: 0, fontSize: 12, textDecoration: "underline" }}
                    >
                      {c.label}
                    </button>
                  ) : (
                    <span style={{ color: INK, fontWeight: 700 }}>{c.label}</span>
                  )}
                </span>
              ))}
            </div>
          );
        })()}

        {view === "syllabus" && migrationOffer && (
          <div style={{ marginBottom: 16 }}>
            <div className="paper-panel" style={{ borderRadius: 4, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12 }}>
                We found existing progress on this device — import it into your account?
              </span>
              <button
                onClick={() => resolveMigration("import")}
                className="mono"
                style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: OLIVE, background: "none", border: `1px solid ${OLIVE}`, borderRadius: 3, padding: "4px 10px", cursor: "pointer" }}
              >
                IMPORT INTO ACCOUNT
              </button>
              <button
                onClick={() => resolveMigration("fresh")}
                className="mono"
                style={{ fontSize: 11, color: MUTED, background: "none", border: `1px solid ${CONTOUR}`, borderRadius: 3, padding: "4px 10px", cursor: "pointer" }}
              >
                START FRESH
              </button>
            </div>
          </div>
        )}

        {view === "syllabus" && Object.keys(pausedQuizzes).length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {Object.entries(pausedQuizzes).map(([cat, p]) => (
              <div key={cat} className="paper-panel" style={{ borderRadius: 4, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12 }}>
                  Quiz paused: <strong>{cat}</strong> — question {p.index + 1} of {pausedLength(p)}
                </span>
                <button
                  onClick={() => startQuiz(cat)}
                  className="mono"
                  style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: OLIVE, background: "none", border: `1px solid ${OLIVE}`, borderRadius: 3, padding: "4px 10px", cursor: "pointer" }}
                >
                  RESUME
                </button>
                <button
                  onClick={() => discardPaused(cat)}
                  className="mono"
                  style={{ fontSize: 11, color: MUTED, background: "none", border: `1px solid ${CONTOUR}`, borderRadius: 3, padding: "4px 10px", cursor: "pointer" }}
                >
                  DISCARD
                </button>
              </div>
            ))}
          </div>
        )}

        {view === "syllabus" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SYLLABUS.map((leg) => {
              const legDone = leg.topics.filter((t) => progress[t.id]?.done).length;
              const isOpen = openLeg === leg.leg;
              const legIsComplete = legDone === leg.topics.length;
              return (
                <div key={leg.leg} className="paper-panel" style={{ borderRadius: 4, overflow: "hidden", borderLeft: `4px solid ${legIsComplete ? OLIVE : CHART_BLUE}` }}>
                  <button
                    onClick={() => setOpenLeg(isOpen ? null : leg.leg)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "none", border: "none", cursor: "pointer", color: INK, textAlign: "left" }}
                  >
                    {isOpen ? <ChevronDown size={16} color={MUTED} /> : <ChevronRight size={16} color={MUTED} />}
                    <span className="mono" style={{ fontSize: 11, color: MAGENTA, border: `1px solid ${MAGENTA}66`, borderRadius: 3, padding: "2px 6px" }}>LEG {leg.leg}</span>
                    <span className="chart-head" style={{ fontWeight: 700, fontSize: 15 }}>{leg.title}</span>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: MUTED }} className="mono">{legDone}/{leg.topics.length}</span>
                  </button>
                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${CONTOUR}55` }}>
                      {leg.topics.map((t) => {
                        const readiness = getTopicReadiness(t);
                        const badgeColor =
                          readiness.status === "pass" ? OLIVE : readiness.status === "fail" ? "#B5651D" : CONTOUR;
                        const badgeText =
                          readiness.status === "n/a" ? "review" : readiness.status === "no-data" ? "no quiz yet" : `${readiness.pct}%`;
                        return (
                          <div key={t.id} style={{ borderBottom: `1px solid ${CONTOUR}33` }}>
                            <div className="topic-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px" }}>
                              <button onClick={() => toggleDone(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                                {progress[t.id]?.done ? <CheckCircle2 size={18} color={OLIVE} /> : <Circle size={18} color={CONTOUR} />}
                              </button>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 15, textDecoration: progress[t.id]?.done ? "line-through" : "none", color: progress[t.id]?.done ? MUTED : INK }}>{t.title}</div>
                                <div style={{ fontSize: 11, color: MUTED }}>{t.hours}h est.</div>
                              </div>
                              {t.reading && (
                                <button
                                  onClick={() => toggleReading(t.id)}
                                  title="Show recommended reading"
                                  style={{ background: "none", border: `1px solid ${CHART_BLUE}66`, borderRadius: 3, padding: "4px 6px", cursor: "pointer", display: "flex", color: CHART_BLUE, flexShrink: 0 }}
                                >
                                  <BookOpen size={13} />
                                </button>
                              )}
                              <span
                                className="mono"
                                title={t.quizCategory ? `Derived from your ${t.quizCategory} quiz score` : "No linked quiz category"}
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: badgeColor,
                                  border: `1px solid ${badgeColor}`,
                                  borderRadius: 3,
                                  padding: "3px 7px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {badgeText}
                              </span>
                            </div>
                            {t.reading && openReadings[t.id] && (
                              <div style={{ padding: "0 18px 12px 44px", fontSize: 11, color: MUTED, display: "flex", flexDirection: "column", gap: 3 }}>
                                {t.reading.fgu && (
                                  <div><strong style={{ color: INK }}>From the Ground Up:</strong> {t.reading.fgu}</div>
                                )}
                                {t.reading.tcaim && (
                                  <div><strong style={{ color: INK }}>TC AIM:</strong> {t.reading.tcaim}</div>
                                )}
                                {t.reading.other && (
                                  <div><strong style={{ color: INK }}>Also see:</strong> {t.reading.other}</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {view === "syllabus" && (
          <div className="paper-panel" style={{ borderRadius: 4, padding: "16px 20px", marginTop: 20, display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
            <Stat icon={<Target size={13} color={CHART_BLUE} />} label="AT RISK" value={`${topicsAtRisk}`} />
            <Stat icon={<BookOpen size={13} color={MAGENTA} />} label="QUIZ ACCURACY" value={overallQuizPct === null ? "—" : `${overallQuizPct}%`} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
              <Clock size={13} color={MUTED} />
              <label style={{ fontSize: 11, color: MUTED }}>EXAM DATE</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                style={{ background: "#fff", border: `1px solid ${CONTOUR}`, borderRadius: 4, color: INK, padding: "5px 9px", fontSize: 12 }}
              />
              {daysToExam !== null && <span className="mono" style={{ fontSize: 12, color: MAGENTA, fontWeight: 700 }}>{daysToExam}D OUT</span>}
            </div>
          </div>
        )}

        {view === "quiz" && !quizCategory && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="chart-head" style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>PRACTICE QUIZ</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <div style={{ fontSize: 13, color: MUTED }}>{totalQuizQuestions} questions across {totalQuizCategories} subject areas — pick a category to drill.</div>
              <button
                onClick={() => setView("glossary")}
                className="mono"
                style={{ background: "none", border: `1px solid ${CHART_BLUE}66`, borderRadius: 3, padding: "5px 10px", color: CHART_BLUE, fontSize: 11, cursor: "pointer", flexShrink: 0 }}
              >
                GLOSSARY
              </button>
              <button
                onClick={resetAll}
                title="Reset quiz scores and answers (syllabus progress and exam date are kept)"
                className="mono"
                style={{ marginLeft: "auto", background: "none", border: `1px solid ${CONTOUR}`, borderRadius: 3, padding: "5px 10px", color: MUTED, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}
              >
                <RotateCcw size={11} /> RESET QUIZZES
              </button>
            </div>
            {Object.keys(QUIZ_BANK).map((cat) => {
              const latest = latestAttempt(quizAttempts, cat);
              const previous = previousAttempt(quizAttempts, cat);
              const pct = attemptPct(latest);
              const prevPct = attemptPct(previous);
              const delta = pct !== null && prevPct !== null ? pct - prevPct : null;
              const attemptCount = (quizAttempts[cat] || []).length;
              const passed = pct !== null && pct >= PASS_MARK;
              const isPaused = !!pausedQuizzes[cat];
              return (
                <button
                  key={cat}
                  onClick={() => startQuiz(cat)}
                  className="paper-panel"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 4, padding: "16px 20px", color: INK, cursor: "pointer", textAlign: "left" }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="chart-head" style={{ fontWeight: 700, fontSize: 14 }}>{cat}</span>
                      {isPaused && (
                        <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: CHART_BLUE, border: `1px solid ${CHART_BLUE}`, borderRadius: 3, padding: "1px 5px" }}>
                          PAUSED
                        </span>
                      )}
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                      {CATEGORY_TO_SECTION[cat].toUpperCase()}
                      {attemptCount > 0 && ` · ${attemptCount} ATTEMPT${attemptCount === 1 ? "" : "S"}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span className="mono" style={{ fontSize: 12, color: pct === null ? MUTED : passed ? OLIVE : "#B5651D", fontWeight: 700 }}>
                      {isPaused
                        ? `Q${pausedQuizzes[cat].index + 1}/${pausedLength(pausedQuizzes[cat])}`
                        : pct === null
                        ? `${QUIZ_BANK[cat].length} questions`
                        : `${pct}% · ${latest.correct}/${latest.total}`}
                    </span>
                    {!isPaused && delta !== null && delta !== 0 && (
                      <div className="mono" style={{ fontSize: 10, color: delta > 0 ? OLIVE : "#B5651D", marginTop: 2 }}>
                        {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} PTS
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {view === "quiz" && quizCategory && (
          <QuizCard
            key={quizQuestions[quizIndex]?.id ?? quizIndex}
            category={quizCategory}
            question={quizQuestions[quizIndex]}
            index={quizIndex}
            total={quizQuestions.length}
            answer={quizAnswer}
            onSubmit={submitAnswer}
            onNext={nextQuestion}
            onSaveExit={saveAndExit}
            onFinishNow={finishNow}
            hasMissed={missedQuestions.length > 0 || sessionTotal > 0}
          />
        )}

        {view === "review" && (
          <div className="paper-panel" style={{ borderRadius: 4, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
              <span className="chart-head" style={{ fontSize: 18, fontWeight: 700 }}>{quizCategory?.toUpperCase()} — RESULTS</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: missedQuestions.length === 0 ? OLIVE : "#B5651D" }}>
                {sessionTotal - missedQuestions.length}/{sessionTotal} correct
              </span>
            </div>
            {(() => {
              // Compare this attempt against the one before it, so improvement is visible
              // right at the moment it happens rather than only on the picker screen.
              const thisPct = sessionTotal ? Math.round(((sessionTotal - missedQuestions.length) / sessionTotal) * 100) : null;
              const prevPct = attemptPct(previousAttempt(quizAttempts, quizCategory));
              if (thisPct === null) return null;
              const delta = prevPct === null ? null : thisPct - prevPct;
              return (
                <div className="mono" style={{ fontSize: 11, color: MUTED, marginTop: -8, marginBottom: 16 }}>
                  This attempt: {thisPct}%
                  {delta === null
                    ? " · first recorded attempt in this category"
                    : delta === 0
                    ? ` · unchanged from your last attempt (${prevPct}%)`
                    : ` · ${delta > 0 ? "up" : "down"} ${Math.abs(delta)} pts from your last attempt (${prevPct}%)`}
                </div>
              );
            })()}
            {missedQuestions.length === 0 ? (
              <div style={{ fontSize: 13, color: MUTED }}>Clean run — no missed questions to review this time.</div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>Review what you missed before moving on:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {missedQuestions.map((mq, i) => (
                    <div key={i} style={{ borderTop: `1px solid ${CONTOUR}33`, paddingTop: 12 }}>
                      <div style={{ fontSize: 13, marginBottom: 8 }}>{mq.q}</div>
                      <div style={{ fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: "#B5651D" }}>Your answer: </span>
                        <span>{mq.options[mq.chosenIndex]}</span>
                      </div>
                      <div style={{ fontSize: 12, marginBottom: 8 }}>
                        <span style={{ color: OLIVE }}>Correct answer: </span>
                        <span>{mq.options[mq.correct]}</span>
                      </div>
                      {mq.explanation && (
                        <div style={{ fontSize: 12, color: MUTED, fontStyle: "italic" }}>{mq.explanation}</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            <button
              onClick={finishReview}
              className="chart-head"
              style={{ marginTop: 18, background: MAGENTA, color: "#F5F9F7", border: "none", borderRadius: 4, padding: "12px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              DONE
            </button>
          </div>
        )}

        {view === "calc" && !calcCategory && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="chart-head" style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>PRACTICE CALCULATIONS</div>
              <button
                onClick={() => setView("glossary")}
                className="mono"
                style={{ marginLeft: "auto", background: "none", border: `1px solid ${CHART_BLUE}66`, borderRadius: 3, padding: "5px 10px", color: CHART_BLUE, fontSize: 11, cursor: "pointer", flexShrink: 0, marginBottom: 4 }}
              >
                GLOSSARY
              </button>
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>
              Randomly generated practice problems with worked solutions. Numbers here are for practice only — always use your own aircraft's actual POH for real flight planning.
            </div>
            {[
              { key: "wx", label: "Weather Chart", desc: "Read GFA-style clouds, icing & turbulence codes", group: "WEATHER" },
              { key: "metar", label: "METAR/TAF Reading", desc: "Decode real-format weather reports and forecasts", group: "WEATHER" },
              { key: "wind", label: "Wind Triangle", desc: "Solve for heading and groundspeed", group: "NAVIGATION" },
              { key: "tas", label: "True Airspeed from CAS", desc: "Apply the density-altitude correction to CAS", group: "NAVIGATION" },
              { key: "wb", label: "Weight & Balance", desc: "Total weight and center of gravity", group: "LOADING" },
              { key: "cgshift", label: "CG Shift on Load Change", desc: "How adding or removing a load shifts CG", group: "LOADING" },
              { key: "density", label: "Density Altitude", desc: "Pressure altitude + temperature deviation", group: "PERFORMANCE" },
              { key: "perf", label: "Performance Chart", desc: "Interpolate takeoff distance from a chart", group: "PERFORMANCE" },
              { key: "fuel", label: "Fuel Planning", desc: "Flight time and fuel required, with reserve", group: "FUEL & TAKEOFF" },
              { key: "xwind", label: "Crosswind Component", desc: "Headwind/tailwind and crosswind for a given runway", group: "FUEL & TAKEOFF" },
              // Instrument Reading temporarily hidden — uncomment to re-enable. Component and
              // generator code (InstrumentCalc, genInstrumentProblem, etc.) left fully intact below.
              // { key: "instr", label: "Instrument Reading", desc: "Read the ASI, attitude indicator, or turn coordinator", group: "IN-FLIGHT INSTRUMENTS" },
            ].map((c, i, arr) => (
              <div key={c.key}>
                {c.group !== arr[i - 1]?.group && (
                  <div className="mono" style={{ fontSize: 10, color: MUTED, letterSpacing: 0.8, marginTop: i === 0 ? 0 : 14, marginBottom: 6 }}>
                    {c.group}
                  </div>
                )}
                <button
                  onClick={() => setCalcCategory(c.key)}
                  className="paper-panel"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 4, padding: "16px 20px", color: INK, cursor: "pointer", textAlign: "left", width: "100%" }}
                >
                  <div>
                    <span className="chart-head" style={{ fontWeight: 700, fontSize: 14 }}>{c.label}</span>
                    <div className="mono" style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{c.desc}</div>
                  </div>
                  <ChevronRight size={16} color={CHART_BLUE} />
                </button>
              </div>
            ))}
          </div>
        )}

        {view === "calc" && calcCategory === "wind" && <WindTriangleCalc onExit={() => setCalcCategory(null)} />}
        {view === "calc" && calcCategory === "density" && <DensityAltitudeCalc onExit={() => setCalcCategory(null)} />}
        {view === "calc" && calcCategory === "wb" && <WeightBalanceCalc onExit={() => setCalcCategory(null)} />}
        {view === "calc" && calcCategory === "fuel" && <FuelPlanningCalc onExit={() => setCalcCategory(null)} />}
        {view === "calc" && calcCategory === "perf" && <PerformanceChartCalc onExit={() => setCalcCategory(null)} />}
        {view === "calc" && calcCategory === "wx" && <WeatherChartCalc onExit={() => setCalcCategory(null)} />}
        {view === "calc" && calcCategory === "metar" && <MetarTafCalc onExit={() => setCalcCategory(null)} />}
        {view === "calc" && calcCategory === "xwind" && <CrosswindCalc onExit={() => setCalcCategory(null)} />}
        {view === "calc" && calcCategory === "tas" && <TasCalc onExit={() => setCalcCategory(null)} />}
        {view === "calc" && calcCategory === "cgshift" && <CGShiftCalc onExit={() => setCalcCategory(null)} />}
        {/* Instrument Reading temporarily hidden — uncomment alongside the picker entry above to re-enable */}
        {/* {view === "calc" && calcCategory === "instr" && <InstrumentCalc onExit={() => setCalcCategory(null)} />} */}

        {view === "glossary" && <GlossaryPage />}

        {view === "exam" && !mockExam && (
          <MockExamSetup history={mockExamHistory} onStart={startExam} />
        )}
        {view === "exam" && mockExam && !mockExam.submitted && (
          <MockExamActive
            exam={mockExam}
            questionIdx={examQuestionIdx}
            setQuestionIdx={setExamQuestionIdx}
            onAnswer={answerExamQuestion}
            onToggleFlag={toggleExamFlag}
            submitConfirm={examSubmitConfirm}
            setSubmitConfirm={setExamSubmitConfirm}
            onSubmit={submitExam}
          />
        )}
        {view === "exam" && mockExam && mockExam.submitted && (
          <MockExamResults exam={mockExam} onNewExam={newExam} />
        )}

        <div style={{ marginTop: 32, paddingTop: 16, borderTop: `1px solid ${CONTOUR}55`, fontSize: 11, color: MUTED, lineHeight: 1.6 }}>
          <div>
            This is a study aid, not an official Transport Canada resource — always verify against current CARs, the TC AIM, and your aircraft's POH before relying on anything here.
          </div>
          <a href="mailto:jeff.mathers@hotmail.com?subject=License%20to%20Learn%20feedback" className="mono" style={{ color: MUTED, textDecoration: "underline", display: "inline-block", marginTop: 6 }}>
            Found a mistake? Report it
          </a>
        </div>
      </div>

      <BottomTabBar
        active={
          view === "syllabus" ? "home" :
          view === "quiz" || view === "review" ? "quiz" :
          view === "exam" ? "exam" :
          "calc"
        }
        onHome={() => requestNav("syllabus", goHome)}
        onQuiz={() => requestNav("quiz", goQuiz)}
        onCalc={() => requestNav("calc", goCalc)}
        onExam={() => setView("exam")}
      />
      {examLeaveTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(34,48,43,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div className="paper-panel" style={{ borderRadius: 4, padding: 22, maxWidth: 360, border: "1px solid #B5651D" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <AlertTriangle size={20} color="#B5651D" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, color: INK, lineHeight: 1.55 }}>
                Your exam is still in progress and the timer keeps running even after you leave. Your answers are saved, but time won't pause.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={confirmExamLeave}
                className="mono"
                style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#F5F9F7", background: "#B5651D", border: "none", borderRadius: 4, padding: "10px 16px", cursor: "pointer" }}
              >
                LEAVE ANYWAY
              </button>
              <button
                onClick={() => setExamLeaveTarget(null)}
                className="mono"
                style={{ flex: 1, fontSize: 12, color: MUTED, background: "none", border: `1px solid ${CONTOUR}`, borderRadius: 4, padding: "10px 16px", cursor: "pointer" }}
              >
                STAY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FullbleedHero({ doneCount, totalCount, legCheckpointX, planeX, legComplete }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", background: PAPER, borderRadius: 4 }}>
      <svg viewBox="0 0 900 320" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {/* granite ridgeline silhouette, evoking the Stawamus Chief above Howe Sound */}
        <path d="M0,320 L0,190 L110,140 L220,190 L330,105 L440,160 L550,85 L660,140 L770,100 L900,150 L900,320 Z" fill={CONTOUR} opacity="0.30" />
        <path d="M0,320 L0,230 L140,200 L260,235 L370,155 L480,195 L590,125 L700,175 L900,150 L900,320 Z" fill={CHART_BLUE} opacity="0.15" />
        <g stroke={MAGENTA} strokeWidth="1" opacity="0.5">
          <line x1="0" y1="60" x2="900" y2="60" strokeDasharray="7 6" />
          <line x1="0" y1="95" x2="900" y2="95" strokeDasharray="7 6" />
        </g>
        <line x1="40" y1="80" x2="860" y2="80" stroke={MAGENTA} strokeWidth="2" strokeDasharray="9 6" />
        {SYLLABUS.map((w, i) => {
          const complete = legComplete(w);
          return (
            <g key={w.leg}>
              <circle cx={legCheckpointX[i]} cy="80" r="8" fill={complete ? OLIVE : PANEL} stroke={complete ? OLIVE : CHART_BLUE} strokeWidth="2" />
              <text x={legCheckpointX[i]} y="105" textAnchor="middle" fontSize="10" fill={INK} fontFamily="JetBrains Mono, monospace">LEG {w.leg}</text>
            </g>
          );
        })}
        <g transform={`translate(${planeX}, 80) rotate(90)`}>
          <path d="M0,-9 L6,7 L0,4 L-6,7 Z" fill={MAGENTA} stroke={INK} strokeWidth="0.6" />
        </g>
      </svg>

      <div style={{ position: "relative", padding: "18px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: 1, color: MUTED }}>PPL WRITTEN EXAM PREP</span>
        <span className="mono" style={{ fontSize: 11, color: MAGENTA, border: `1px solid ${MAGENTA}`, borderRadius: 3, padding: "3px 8px", background: PANEL }}>{doneCount}/{totalCount} TOPICS</span>
      </div>

      <div style={{ position: "relative", padding: "56px 20px 26px", background: `linear-gradient(180deg, rgba(231,237,234,0), ${PAPER} 46%)` }}>
        <div className="chart-head" style={{ fontSize: 32, fontWeight: 700, color: INK, lineHeight: 1.05 }}>LICENSE TO LEARN</div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>Four legs, one written exam. Track your route below.</div>
      </div>
    </div>
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("License to Learn crashed:", error, info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: PAPER, fontFamily: "Inter, sans-serif" }}>
          <div style={{ maxWidth: 380, textAlign: "center" }}>
            <div style={{ fontFamily: "Bitter, serif", fontSize: 22, fontWeight: 700, color: INK, marginBottom: 10 }}>Something went wrong</div>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.6 }}>
              License to Learn hit an unexpected error and couldn't continue. Your saved progress isn't affected — reloading should bring you right back to where you left off.
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{ background: MAGENTA, color: "#F5F9F7", border: "none", borderRadius: 4, padding: "12px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" }}
            >
              RELOAD
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function PPLGroundSchoolSectional() {
  return (
    <ErrorBoundary>
      <PPLGroundSchoolSectionalInner />
    </ErrorBoundary>
  );
}
