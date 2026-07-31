// All 11 practice calculators. 10 are wired into the app's picker (Wind Triangle,
// Density Altitude, Weight & Balance, Performance Chart, Fuel Planning, Weather Chart,
// METAR/TAF Reading, Crosswind Component, True Airspeed from CAS, CG Shift on Load Change).
// InstrumentCalc exists here too for parity with the live app, where it's temporarily
// hidden from the calculator picker (component code kept intact, not deleted) — see the
// commented-out registration in App.jsx to re-enable it.

import { useState } from "react";
import { INK, MUTED, PAPER, CONTOUR, MAGENTA, CHART_BLUE, OLIVE } from "../theme";
import { CalcHeader, NumberField, SelectButtons, ResultBanner, ApproachGuide, CGEnvelopeGraph } from "./shared";
import { genWindProblem, genDensityProblem, genWBProblem, PERF_PA_ROWS, PERF_OAT_COLS, perfGroundRoll, perfObstacleDist, genPerfProblem, genWeatherProblem, WX_LEGEND, genMetarTafProblem, METAR_LEGEND, genFuelProblem, buildWeatherProbes, buildMetarTafProbes, genCrosswindProblem, genTasProblem, genCGShiftProblem, genInstrumentProblem, polarToXY, describeArc, ASI_BANDS } from "../lib/calculators";

export function WindTriangleCalc({ onExit }) {
  const [problem, setProblem] = useState(genWindProblem);
  const [heading, setHeading] = useState("");
  const [gs, setGs] = useState("");
  const [checked, setChecked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const newProblem = () => {
    setProblem(genWindProblem());
    setHeading("");
    setGs("");
    setChecked(false);
    setShowSolution(false);
  };

  const headingOk = Math.abs(((parseFloat(heading) - problem.heading + 540) % 360) - 180) <= 3;
  const gsOk = Math.abs(parseFloat(gs) - problem.gs) <= 4;
  const bothOk = heading !== "" && gs !== "" && headingOk && gsOk;

  return (
    <div className="paper-panel" style={{ borderRadius: 4, padding: 22 }}>
      <CalcHeader title="WIND TRIANGLE" onNewProblem={newProblem} onExit={onExit} />
      <ApproachGuide
        steps={[
          "Write down what you know: true course (TC), true airspeed (TAS), and the wind's direction and speed.",
          "Find the angle between the wind direction and your course (A = wind direction − true course).",
          "The wind correction angle (WCA) tells you how far to crab into the wind — it grows with wind speed and shrinks with true airspeed.",
          "Add the WCA to your true course to get the heading to fly (crab toward the side the wind is coming from).",
          "The resulting groundspeed reflects the head/tailwind component — a wind mostly behind you increases groundspeed, mostly ahead of you decreases it.",
        ]}
      />
      <div style={{ fontSize: 14, marginBottom: 18, lineHeight: 1.65 }}>
        True course: <strong>{String(problem.tc).padStart(3, "0")}°</strong><br />
        True airspeed: <strong>{problem.tas} kt</strong><br />
        Wind: <strong>{String(problem.wd).padStart(3, "0")}° at {problem.ws} kt</strong><br />
        Find the heading to fly and the resulting groundspeed.
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 8 }}>
        <NumberField label="Heading" value={heading} onChange={setHeading} unit="°" status={checked ? (headingOk ? "correct" : "incorrect") : undefined} />
        <NumberField label="Ground speed" value={gs} onChange={setGs} unit="kt" status={checked ? (gsOk ? "correct" : "incorrect") : undefined} />
      </div>
      <button
        onClick={() => setChecked(true)}
        className="chart-head"
        style={{ marginTop: 8, background: MAGENTA, color: "#F5F9F7", border: "none", borderRadius: 4, padding: "12px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
      >
        CHECK
      </button>
      {checked && (
        <ResultBanner correct={bothOk}>
          {bothOk
            ? "Correct — within tolerance."
            : `Correct answer: heading ${problem.heading.toFixed(0).padStart(3, "0")}°, groundspeed ${problem.gs.toFixed(0)} kt (±3° / ±4 kt tolerance).`}
        </ResultBanner>
      )}
      <button
        onClick={() => setShowSolution((s) => !s)}
        className="mono"
        style={{ display: "block", marginTop: 24, fontSize: 11, color: CHART_BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
      >
        {showSolution ? "Hide worked solution" : "Show worked solution"}
      </button>
      {showSolution && (
        <div style={{ marginTop: 10, fontSize: 12, color: MUTED, lineHeight: 1.7 }}>
          1. Angle between wind and course: A = WD − TC = {problem.wd}° − {problem.tc}° = {(problem.wd - problem.tc).toFixed(0)}°<br />
          2. Wind correction angle: WCA = arcsin((WS/TAS) × sin A) = arcsin(({problem.ws}/{problem.tas}) × sin {(problem.wd - problem.tc).toFixed(0)}°) ≈ {problem.wcaDeg.toFixed(1)}°<br />
          3. Heading = TC + WCA = {problem.tc}° + {problem.wcaDeg.toFixed(1)}° ≈ {problem.heading.toFixed(0)}°<br />
          4. Ground speed = TAS × cos(WCA) − WS × cos(A) ≈ {problem.gs.toFixed(0)} kt
        </div>
      )}
    </div>
  );
}

export function DensityAltitudeCalc({ onExit }) {
  const [problem, setProblem] = useState(genDensityProblem);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const newProblem = () => {
    setProblem(genDensityProblem());
    setAnswer("");
    setChecked(false);
    setShowSolution(false);
  };

  const ok = answer !== "" && Math.abs(parseFloat(answer) - problem.da) <= 150;

  return (
    <div className="paper-panel" style={{ borderRadius: 4, padding: 22 }}>
      <CalcHeader title="DENSITY ALTITUDE" onNewProblem={newProblem} onExit={onExit} />
      <ApproachGuide
        steps={[
          "Start with pressure altitude — the altitude your altimeter would show with 29.92 in Hg set.",
          "Work out the ISA standard temperature at that pressure altitude (15°C at sea level, dropping about 2°C per 1,000 ft).",
          "Compare the actual outside air temperature to that standard — how many degrees above or below ISA is it?",
          "Add roughly 120 ft of density altitude for every degree Celsius above ISA (subtract if below).",
          "Remember what it means: higher density altitude reduces engine power, propeller efficiency, and lift — longer takeoff rolls and weaker climb.",
        ]}
      />
      <div style={{ fontSize: 14, marginBottom: 18, lineHeight: 1.65 }}>
        Pressure altitude: <strong>{problem.pa.toLocaleString()} ft</strong><br />
        Outside air temperature: <strong>{problem.oat}°C</strong><br />
        Find the density altitude.
      </div>
      <NumberField label="Density altitude" value={answer} onChange={setAnswer} unit="ft" status={checked ? (ok ? "correct" : "incorrect") : undefined} />
      <button
        onClick={() => setChecked(true)}
        className="chart-head"
        style={{ marginTop: 14, background: MAGENTA, color: "#F5F9F7", border: "none", borderRadius: 4, padding: "12px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
      >
        CHECK
      </button>
      {checked && (
        <ResultBanner correct={ok}>
          {ok ? "Correct — within tolerance." : `Correct answer: approximately ${Math.round(problem.da / 50) * 50} ft (±150 ft tolerance).`}
        </ResultBanner>
      )}
      <button
        onClick={() => setShowSolution((s) => !s)}
        className="mono"
        style={{ display: "block", marginTop: 24, fontSize: 11, color: CHART_BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
      >
        {showSolution ? "Hide worked solution" : "Show worked solution"}
      </button>
      {showSolution && (
        <div style={{ marginTop: 10, fontSize: 12, color: MUTED, lineHeight: 1.7 }}>
          1. ISA standard temperature at this pressure altitude: 15°C − 2°C per 1,000 ft × {problem.pa / 1000} = {problem.isaTemp.toFixed(1)}°C<br />
          2. Temperature deviation from ISA: {problem.oat}°C − {problem.isaTemp.toFixed(1)}°C = {(problem.oat - problem.isaTemp).toFixed(1)}°C<br />
          3. Density altitude ≈ pressure altitude + 120 ft × deviation = {problem.pa} + 120 × {(problem.oat - problem.isaTemp).toFixed(1)} ≈ {Math.round(problem.da)} ft
        </div>
      )}
    </div>
  );
}

export function WeightBalanceCalc({ onExit }) {
  const [problem, setProblem] = useState(genWBProblem);
  const [weight, setWeight] = useState("");
  const [cg, setCg] = useState("");
  const [envelopeAnswer, setEnvelopeAnswer] = useState(null); // "yes" | "no" | null
  const [checked, setChecked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const newProblem = () => {
    setProblem(genWBProblem());
    setWeight("");
    setCg("");
    setEnvelopeAnswer(null);
    setChecked(false);
    setShowSolution(false);
  };

  const weightOk = weight !== "" && Math.abs(parseFloat(weight) - problem.totalWeight) <= 5;
  const cgOk = cg !== "" && Math.abs(parseFloat(cg) - problem.cg) <= 0.3;
  const envelopeOk = envelopeAnswer !== null && (envelopeAnswer === "yes") === problem.withinLimits;
  const bothOk = weightOk && cgOk && envelopeOk;

  return (
    <div className="paper-panel" style={{ borderRadius: 4, padding: 22 }}>
      <CalcHeader title="WEIGHT & BALANCE" onNewProblem={newProblem} onExit={onExit} />
      <ApproachGuide
        steps={[
          "List every loaded item (empty aircraft, occupants, baggage, fuel) along with its weight and its arm — the distance from the aircraft's reference datum.",
          "Multiply each item's weight by its arm to get that item's moment.",
          "Add up all the weights to get total weight.",
          "Add up all the moments to get total moment.",
          "Divide total moment by total weight to find the center of gravity (CG).",
          "In a real flight, you'd then check total weight against max gross weight, and CG against the forward/aft limits from the POH, to confirm the load is legal.",
        ]}
      />
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 10, fontStyle: "italic" }}>
        Practice-only figures for a generic training aircraft — always use your own aircraft's actual POH for real flight planning.
      </div>
      <table style={{ width: "100%", fontSize: 12, marginBottom: 14, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${CONTOUR}66` }}>
            <th style={{ textAlign: "left", padding: "4px 0", color: MUTED, fontWeight: 600 }}>Item</th>
            <th style={{ textAlign: "right", padding: "4px 0", color: MUTED, fontWeight: 600 }}>Weight (lb)</th>
            <th style={{ textAlign: "right", padding: "4px 0", color: MUTED, fontWeight: 600 }}>Arm (in)</th>
          </tr>
        </thead>
        <tbody>
          {problem.items.map((i, idx) => (
            <tr key={idx} style={{ borderBottom: `1px solid ${CONTOUR}33` }}>
              <td style={{ padding: "4px 0" }}>{i.label}</td>
              <td style={{ textAlign: "right", padding: "4px 0" }}>{i.weight}</td>
              <td style={{ textAlign: "right", padding: "4px 0" }}>{i.arm.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
        <NumberField label="Total weight" value={weight} onChange={setWeight} unit="lb" status={checked ? (weightOk ? "correct" : "incorrect") : undefined} />
        <NumberField label="Center of gravity" value={cg} onChange={setCg} unit="in" status={checked ? (cgOk ? "correct" : "incorrect") : undefined} />
      </div>

      <CGEnvelopeGraph
        cg={checked ? problem.cg : parseFloat(cg)}
        weight={checked ? problem.totalWeight : parseFloat(weight)}
        showPoint={checked}
        pointOk={problem.withinLimits}
      />

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 6 }}>Is this loading within the CG envelope?</label>
        <SelectButtons
          options={["yes", "no"]}
          value={envelopeAnswer}
          onChange={setEnvelopeAnswer}
          checked={checked}
          correctValue={problem.withinLimits ? "yes" : "no"}
        />
      </div>

      <button
        onClick={() => setChecked(true)}
        className="chart-head"
        style={{ marginTop: 8, background: MAGENTA, color: "#F5F9F7", border: "none", borderRadius: 4, padding: "12px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
      >
        CHECK
      </button>
      {checked && (
        <ResultBanner correct={bothOk}>
          {bothOk
            ? "Correct — within tolerance."
            : `Correct answer: total weight ${problem.totalWeight} lb, CG ${problem.cg.toFixed(2)} in — ${problem.withinLimits ? "within" : "outside"} the CG envelope (±5 lb / ±0.3 in tolerance).`}
        </ResultBanner>
      )}
      <button
        onClick={() => setShowSolution((s) => !s)}
        className="mono"
        style={{ display: "block", marginTop: 24, fontSize: 11, color: CHART_BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
      >
        {showSolution ? "Hide worked solution" : "Show worked solution"}
      </button>
      {showSolution && (
        <div style={{ marginTop: 10, fontSize: 12, color: MUTED, lineHeight: 1.7 }}>
          1. Moment for each item = weight × arm:<br />
          {problem.items.map((i, idx) => (
            <span key={idx}>
              &nbsp;&nbsp;{i.label}: {i.weight} × {i.arm.toFixed(1)} = {(i.weight * i.arm).toFixed(0)} lb-in<br />
            </span>
          ))}
          2. Total weight = sum of weights = {problem.totalWeight} lb<br />
          3. Total moment = sum of moments = {problem.totalMoment.toFixed(0)} lb-in<br />
          4. CG = total moment ÷ total weight = {problem.totalMoment.toFixed(0)} ÷ {problem.totalWeight} ≈ {problem.cg.toFixed(2)} in<br />
          5. Plot that point on the loading graph against the forward/aft limits at this weight — it falls {problem.withinLimits ? "inside" : "outside"} the envelope, so this loading is {problem.withinLimits ? "legal" : "not legal"}.
        </div>
      )}
    </div>
  );
}

export function PerformanceChartCalc({ onExit }) {
  const [problem, setProblem] = useState(genPerfProblem);
  const [grAns, setGrAns] = useState("");
  const [obAns, setObAns] = useState("");
  const [checked, setChecked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const newProblem = () => {
    setProblem(genPerfProblem());
    setGrAns("");
    setObAns("");
    setChecked(false);
    setShowSolution(false);
  };

  const grOk = grAns !== "" && Math.abs(parseFloat(grAns) - problem.groundRoll) <= 25;
  const obOk = obAns !== "" && Math.abs(parseFloat(obAns) - problem.obstacleDist) <= 35;
  const bothOk = grOk && obOk;

  return (
    <div className="paper-panel" style={{ borderRadius: 4, padding: 22 }}>
      <CalcHeader title="PERFORMANCE CHART" onNewProblem={newProblem} onExit={onExit} />
      <ApproachGuide
        steps={[
          "Find the two pressure-altitude rows that bracket your value, and the two temperature columns that bracket your OAT.",
          "At the lower temperature column, interpolate between the two bracketing PA rows to get an intermediate value.",
          "Do the same at the higher temperature column, using the same two PA rows.",
          "Interpolate between those two results using where your actual OAT falls between the two temperature columns.",
          "That final number is your answer — the same two-step interpolation works for any value in the table, including ground roll and obstacle-clearance distance.",
        ]}
      />
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 10, fontStyle: "italic" }}>
        Practice-only chart for a generic training aircraft — on the real exam you'll be given the actual aircraft's performance chart in the exam supplement.
      </div>

      <table style={{ width: "100%", fontSize: 11, marginBottom: 14, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${CONTOUR}66` }}>
            <th style={{ textAlign: "left", padding: "5px 4px", color: MUTED, fontWeight: 600 }}>PA (ft) \ OAT (°C)</th>
            {PERF_OAT_COLS.map((oat) => (
              <th key={oat} style={{ textAlign: "center", padding: "5px 4px", color: MUTED, fontWeight: 600 }}>{oat}°C</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERF_PA_ROWS.map((pa) => (
            <tr key={pa} style={{ borderBottom: `1px solid ${CONTOUR}33` }}>
              <td style={{ padding: "5px 4px", fontWeight: 600 }}>{pa.toLocaleString()}</td>
              {PERF_OAT_COLS.map((oat) => (
                <td key={oat} style={{ textAlign: "center", padding: "5px 4px" }}>
                  {Math.round(perfGroundRoll(pa, oat))} / {Math.round(perfObstacleDist(pa, oat))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 10, color: MUTED, marginBottom: 16 }}>Each cell shows ground roll / distance to clear a 50 ft obstacle, in feet.</div>

      <div style={{ fontSize: 14, marginBottom: 18, lineHeight: 1.65 }}>
        Pressure altitude: <strong>{problem.paQuery.toLocaleString()} ft</strong><br />
        Outside air temperature: <strong>{problem.oatQuery}°C</strong><br />
        Interpolate the chart to find the ground roll and the distance to clear a 50 ft obstacle.
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 8 }}>
        <NumberField label="Ground roll" value={grAns} onChange={setGrAns} unit="ft" status={checked ? (grOk ? "correct" : "incorrect") : undefined} />
        <NumberField label="50 ft obstacle distance" value={obAns} onChange={setObAns} unit="ft" status={checked ? (obOk ? "correct" : "incorrect") : undefined} />
      </div>
      <button
        onClick={() => setChecked(true)}
        className="chart-head"
        style={{ marginTop: 8, background: MAGENTA, color: "#F5F9F7", border: "none", borderRadius: 4, padding: "12px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
      >
        CHECK
      </button>
      {checked && (
        <ResultBanner correct={bothOk}>
          {bothOk
            ? "Correct — within tolerance."
            : `Correct answer: ground roll ≈ ${Math.round(problem.groundRoll)} ft, obstacle distance ≈ ${Math.round(problem.obstacleDist)} ft (±25 ft / ±35 ft tolerance).`}
        </ResultBanner>
      )}
      <button
        onClick={() => setShowSolution((s) => !s)}
        className="mono"
        style={{ display: "block", marginTop: 24, fontSize: 11, color: CHART_BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
      >
        {showSolution ? "Hide worked solution" : "Show worked solution"}
      </button>
      {showSolution && (
        <div style={{ marginTop: 10, fontSize: 12, color: MUTED, lineHeight: 1.8 }}>
          <strong style={{ color: INK }}>Ground roll:</strong><br />
          1. Bracketing rows: {problem.grInterp.pa0.toLocaleString()} ft and {problem.grInterp.pa1.toLocaleString()} ft. Bracketing columns: {problem.grInterp.oat0}°C and {problem.grInterp.oat1}°C.<br />
          2. At {problem.grInterp.oat0}°C: interpolate {problem.grInterp.q11} to {problem.grInterp.q21} at fraction {problem.grInterp.tPA.toFixed(2)} → {(problem.grInterp.q11 + problem.grInterp.tPA * (problem.grInterp.q21 - problem.grInterp.q11)).toFixed(0)}<br />
          3. At {problem.grInterp.oat1}°C: interpolate {problem.grInterp.q12} to {problem.grInterp.q22} at fraction {problem.grInterp.tPA.toFixed(2)} → {(problem.grInterp.q12 + problem.grInterp.tPA * (problem.grInterp.q22 - problem.grInterp.q12)).toFixed(0)}<br />
          4. Interpolate those two results at fraction {problem.grInterp.tOAT.toFixed(2)} (your OAT position between {problem.grInterp.oat0}°C and {problem.grInterp.oat1}°C) ≈ <strong>{Math.round(problem.groundRoll)} ft</strong><br />
          <br />
          <strong style={{ color: INK }}>50 ft obstacle distance</strong> follows the same four steps using the obstacle-distance half of each cell ≈ <strong>{Math.round(problem.obstacleDist)} ft</strong>
        </div>
      )}
    </div>
  );
}

export function FuelPlanningCalc({ onExit }) {
  const [problem, setProblem] = useState(genFuelProblem);
  const [timeAns, setTimeAns] = useState("");
  const [fuelAns, setFuelAns] = useState("");
  const [checked, setChecked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const newProblem = () => {
    setProblem(genFuelProblem());
    setTimeAns("");
    setFuelAns("");
    setChecked(false);
    setShowSolution(false);
  };

  const timeOk = timeAns !== "" && Math.abs(parseFloat(timeAns) - problem.flightTimeMinutes) <= 3;
  const fuelOk = fuelAns !== "" && Math.abs(parseFloat(fuelAns) - problem.fuelRequired) <= 1.5;
  const bothOk = timeOk && fuelOk;

  return (
    <div className="paper-panel" style={{ borderRadius: 4, padding: 22 }}>
      <CalcHeader title="FUEL PLANNING" onNewProblem={newProblem} onExit={onExit} />
      <ApproachGuide
        steps={[
          "Work out flight time first: distance ÷ groundspeed, converted to minutes.",
          "Add the required reserve for the flight type — CAR 602.88 sets 30 minutes for day VFR, 45 minutes for night VFR.",
          "Convert that total time (flight + reserve) into hours.",
          "Multiply total time by the fuel burn rate to get total fuel required.",
          "In a real flight, compare that figure against usable fuel onboard, and build in margin for taxi, climb, and expected delays — CAR 602.88 fuel is a legal minimum, not a target.",
        ]}
      />
      <div style={{ fontSize: 14, marginBottom: 18, lineHeight: 1.65 }}>
        Distance to destination: <strong>{problem.distance} nm</strong><br />
        Groundspeed: <strong>{problem.groundspeed} kt</strong><br />
        Fuel burn rate: <strong>{problem.burnRate.toFixed(1)} USG/hr</strong><br />
        {problem.isNight ? "Night" : "Day"} VFR flight — find the flight time to destination and the total fuel required including the CAR 602.88 {problem.reserveMinutes}-minute reserve.
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 8 }}>
        <NumberField label="Flight time (to destination)" value={timeAns} onChange={setTimeAns} unit="min" status={checked ? (timeOk ? "correct" : "incorrect") : undefined} />
        <NumberField label="Total fuel required" value={fuelAns} onChange={setFuelAns} unit="USG" status={checked ? (fuelOk ? "correct" : "incorrect") : undefined} />
      </div>
      <button
        onClick={() => setChecked(true)}
        className="chart-head"
        style={{ marginTop: 8, background: MAGENTA, color: "#F5F9F7", border: "none", borderRadius: 4, padding: "12px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
      >
        CHECK
      </button>
      {checked && (
        <ResultBanner correct={bothOk}>
          {bothOk
            ? "Correct — within tolerance."
            : `Correct answer: ${problem.flightTimeMinutes.toFixed(0)} min flight time, ${problem.fuelRequired.toFixed(1)} USG total fuel (±3 min / ±1.5 gal tolerance).`}
        </ResultBanner>
      )}
      <button
        onClick={() => setShowSolution((s) => !s)}
        className="mono"
        style={{ display: "block", marginTop: 24, fontSize: 11, color: CHART_BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
      >
        {showSolution ? "Hide worked solution" : "Show worked solution"}
      </button>
      {showSolution && (
        <div style={{ marginTop: 10, fontSize: 12, color: MUTED, lineHeight: 1.7 }}>
          1. Flight time = distance ÷ groundspeed = {problem.distance} ÷ {problem.groundspeed} × 60 ≈ {problem.flightTimeMinutes.toFixed(0)} min<br />
          2. Total time including the {problem.isNight ? "night" : "day"} VFR reserve = {problem.flightTimeMinutes.toFixed(0)} + {problem.reserveMinutes} = {(problem.flightTimeMinutes + problem.reserveMinutes).toFixed(0)} min<br />
          3. Fuel required = (total time ÷ 60) × burn rate = ({(problem.flightTimeMinutes + problem.reserveMinutes).toFixed(0)} ÷ 60) × {problem.burnRate.toFixed(1)} ≈ {problem.fuelRequired.toFixed(1)} USG
        </div>
      )}
    </div>
  );
}

export function WeatherChartCalc({ onExit }) {
  const [problem, setProblem] = useState(genWeatherProblem);
  const [probes, setProbes] = useState(() => buildWeatherProbes(problem));
  const [answers, setAnswers] = useState({});
  const [intensityAns, setIntensityAns] = useState(null);
  const [checked, setChecked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  const newProblem = () => {
    const p = genWeatherProblem();
    setProblem(p);
    setProbes(buildWeatherProbes(p));
    setAnswers({});
    setIntensityAns(null);
    setChecked(false);
    setShowSolution(false);
  };

  const results = probes.map((probe) => {
    const val = answers[probe.id];
    const ok = val !== undefined && val !== "" && Math.abs(parseFloat(val) - probe.correct) <= probe.tol;
    return { ...probe, ok };
  });
  const intensityOk = intensityAns !== null && intensityAns === problem.hazardIntensity;
  const bothOk = results.length > 0 && results.every((r) => r.ok) && intensityOk;

  const cloudLine = `${problem.coverage} ${problem.tops}/${problem.base}${problem.convective ? " " + problem.convective : ""}`;
  const cloudLine2 = problem.hasSecondLayer ? `${problem.coverage2} ${problem.tops2}/${problem.base2}` : null;
  const wxLine = problem.hasWx ? `${problem.wxIntensity}${problem.wxPhenom}` : "NIL WX";
  const hazardLine =
    problem.hazardType === "icing"
      ? `${problem.hazardIntensity} ${problem.hazardTypeLabel} ICG ${problem.hazardTops}/${problem.hazardBase}`
      : `${problem.hazardIntensity}${problem.hazardTypeLabel ? " " + problem.hazardTypeLabel : ""} TURB ${problem.hazardTops}/${problem.hazardBase}`;
  const fzlvlLine = `FZLVL ${problem.freezingLevelHundreds * 100} FT ASL`;

  return (
    <div className="paper-panel" style={{ borderRadius: 4, padding: 22 }}>
      <CalcHeader title="WEATHER CHART" onNewProblem={newProblem} onExit={onExit} />
      <ApproachGuide
        steps={[
          "Read the cloud group as coverage, then tops over base in hundreds of feet ASL — e.g. BKN 80/40 means broken cloud, tops 8,000 ft, base 4,000 ft.",
          "TCU or CB after the cloud group means convective cloud (towering cumulus or cumulonimbus) is present — always noted when forecast.",
          "The weather code's prefix shows intensity: '-' is light, no prefix is moderate, '+' is heavy, attached directly to the phenomenon code.",
          "The icing/turbulence panel uses the same tops/base format, with an intensity (LGT/MOD/SEV) and, for icing, a type (RIME/MXD/CLR).",
          "Freezing level is the altitude where temperature crosses 0°C — check it against your cruising altitude to anticipate icing risk.",
          "On a real flight, you'd cross-reference both the clouds/weather chart and the icing/turbulence/freezing-level chart for the same area and time.",
        ]}
      />
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 10, fontStyle: "italic" }}>
        Simplified practice codes using real GFA terminology and units — complexity and questions vary each time. Not a reproduction of the official chart artwork.
      </div>

      <div className="paper-panel" style={{ borderRadius: 4, padding: "12px 16px", marginBottom: 10, border: `1px solid ${CONTOUR}` }}>
        <div className="mono" style={{ fontSize: 10, color: MUTED, marginBottom: 6, letterSpacing: 0.5 }}>CLOUDS &amp; WEATHER</div>
        <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: INK }}>{cloudLine}</div>
        {cloudLine2 && <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: INK }}>{cloudLine2}</div>}
        <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: INK }}>{wxLine}  VIS {problem.visibilitySM}SM</div>
      </div>
      <div className="paper-panel" style={{ borderRadius: 4, padding: "12px 16px", marginBottom: 6, border: `1px solid ${CONTOUR}` }}>
        <div className="mono" style={{ fontSize: 10, color: MUTED, marginBottom: 6, letterSpacing: 0.5 }}>ICING / TURBULENCE / FREEZING LEVEL</div>
        <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: INK }}>{hazardLine}</div>
        <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: INK }}>{fzlvlLine}</div>
      </div>

      <button
        onClick={() => setShowLegend((s) => !s)}
        className="mono"
        style={{ fontSize: 11, color: CHART_BLUE, background: "none", border: `1px solid ${CHART_BLUE}66`, borderRadius: 3, padding: "5px 10px", cursor: "pointer", marginBottom: 16 }}
      >
        {showLegend ? "Hide code legend" : "Show code legend"}
      </button>
      {showLegend && (
        <div style={{ marginBottom: 16, fontSize: 11, color: MUTED, lineHeight: 1.8 }}>
          {WX_LEGEND.map(([code, meaning], i) => (
            <div key={i}><strong style={{ color: INK }} className="mono">{code}</strong> — {meaning}</div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 13, marginBottom: 12 }}>Read the codes above and answer:</div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
        {results.map((probe) => (
          <NumberField
            key={probe.id}
            label={probe.label}
            value={answers[probe.id] ?? ""}
            onChange={(v) => setAnswers((a) => ({ ...a, [probe.id]: v }))}
            unit={probe.unit}
            status={checked ? (probe.ok ? "correct" : "incorrect") : undefined}
          />
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 6 }}>
          What's the {problem.hazardType === "icing" ? "icing" : "turbulence"} intensity?
        </label>
        <SelectButtons
          options={problem.hazardOptions}
          value={intensityAns}
          onChange={setIntensityAns}
          checked={checked}
          correctValue={problem.hazardIntensity}
        />
      </div>

      <button
        onClick={() => setChecked(true)}
        className="chart-head"
        style={{ marginTop: 8, background: MAGENTA, color: "#F5F9F7", border: "none", borderRadius: 4, padding: "12px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
      >
        CHECK
      </button>
      {checked && (
        <ResultBanner correct={bothOk}>
          {bothOk ? (
            "Correct — within tolerance."
          ) : (
            <span>
              Some answers were off. Correct values:{" "}
              {results.filter((r) => !r.ok).map((r, i) => (
                <span key={r.id}>
                  {i > 0 ? ", " : ""}
                  {r.label} = {r.correct}{r.unit}
                </span>
              ))}
              {!intensityOk && `${results.some((r) => !r.ok) ? ", " : ""}intensity = ${problem.hazardIntensity}`}.
            </span>
          )}
        </ResultBanner>
      )}
      <button
        onClick={() => setShowSolution((s) => !s)}
        className="mono"
        style={{ display: "block", marginTop: 24, fontSize: 11, color: CHART_BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
      >
        {showSolution ? "Hide worked solution" : "Show worked solution"}
      </button>
      {showSolution && (
        <div style={{ marginTop: 10, fontSize: 12, color: MUTED, lineHeight: 1.8 }}>
          <strong style={{ color: INK }}>{cloudLine}</strong> → {problem.coverage} coverage, tops {problem.tops * 100} ft ASL, base {problem.base * 100} ft ASL{problem.convective ? `, with ${problem.convective} (convective cloud) present` : ""}.<br />
          {cloudLine2 && (
            <><strong style={{ color: INK }}>{cloudLine2}</strong> → {problem.coverage2} coverage, tops {problem.tops2 * 100} ft ASL, base {problem.base2 * 100} ft ASL.<br /></>
          )}
          <strong style={{ color: INK }}>{wxLine}</strong> → {problem.hasWx ? `${problem.wxIntensity === "-" ? "light" : problem.wxIntensity === "+" ? "heavy" : "moderate"} intensity ${problem.wxPhenom}` : "no significant weather forecast"}, visibility {problem.visibilitySM} SM.<br />
          <strong style={{ color: INK }}>{hazardLine}</strong> → {problem.hazardIntensity} {problem.hazardType}, {problem.hazardTops * 100}/{problem.hazardBase * 100} ft ASL.<br />
          <strong style={{ color: INK }}>{fzlvlLine}</strong> → freezing level at {problem.freezingLevelHundreds * 100} ft ASL.
        </div>
      )}
    </div>
  );
}

export function MetarTafCalc({ onExit }) {
  const [problem, setProblem] = useState(genMetarTafProblem);
  const [probes, setProbes] = useState(() => buildMetarTafProbes(problem));
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  const newProblem = () => {
    const p = genMetarTafProblem();
    setProblem(p);
    setProbes(buildMetarTafProbes(p));
    setAnswers({});
    setChecked(false);
    setShowSolution(false);
  };

  const allProbes = [...probes.metarPicked, ...probes.tafPicked];
  const results = allProbes.map((probe) => {
    const val = answers[probe.id];
    const ok = val !== undefined && val !== "" && Math.abs(parseFloat(val) - probe.correct) <= probe.tol;
    return { ...probe, ok };
  });
  const resultById = Object.fromEntries(results.map((r) => [r.id, r]));
  const bothOk = results.length > 0 && results.every((r) => r.ok);

  return (
    <div className="paper-panel" style={{ borderRadius: 4, padding: 22 }}>
      <CalcHeader title="METAR / TAF READING" onNewProblem={newProblem} onExit={onExit} />
      <ApproachGuide
        steps={[
          "Break the report into its fixed order: station, time, wind, visibility, weather, clouds, temperature/dewpoint, altimeter.",
          "Wind is three digits for direction, then two for speed in knots — a G before two more digits marks a gust. VRB means variable direction; 00000KT means calm.",
          "Visibility in Canada is always statute miles, shown right after the wind group.",
          "Cloud groups show coverage (FEW/SCT/BKN/OVC) then a 3-digit height in hundreds of feet AGL — the lowest BKN or OVC layer is the ceiling.",
          "Temperature/dewpoint are whole °C separated by a slash; an M prefix means negative.",
          "The altimeter group starts with A — divide the 4 digits by 100 to get inches of mercury.",
          "A TAF's validity period and any BECMG/TEMPO/FM groups work the same way, just spread across a forecast period instead of one moment — and the period length can vary.",
        ]}
      />
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 10, fontStyle: "italic" }}>
        Randomly generated practice reports using real Canadian METAR/TAF format conventions — complexity and questions vary each time.
      </div>

      <div className="paper-panel" style={{ borderRadius: 4, padding: "14px 16px", marginBottom: 10, border: `1px solid ${CONTOUR}` }}>
        <div className="mono" style={{ fontSize: 10, color: MUTED, marginBottom: 6, letterSpacing: 0.5 }}>METAR</div>
        <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: INK, wordBreak: "break-word" }}>{problem.metarLine}</div>
      </div>
      <div className="paper-panel" style={{ borderRadius: 4, padding: "14px 16px", marginBottom: 6, border: `1px solid ${CONTOUR}` }}>
        <div className="mono" style={{ fontSize: 10, color: MUTED, marginBottom: 6, letterSpacing: 0.5 }}>TAF</div>
        <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: INK, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{problem.tafLine}</div>
      </div>

      <button
        onClick={() => setShowLegend((s) => !s)}
        className="mono"
        style={{ fontSize: 11, color: CHART_BLUE, background: "none", border: `1px solid ${CHART_BLUE}66`, borderRadius: 3, padding: "5px 10px", cursor: "pointer", marginBottom: 16 }}
      >
        {showLegend ? "Hide code legend" : "Show code legend"}
      </button>
      {showLegend && (
        <div style={{ marginBottom: 16, fontSize: 11, color: MUTED, lineHeight: 1.8 }}>
          {METAR_LEGEND.map(([code, meaning], i) => (
            <div key={i}><strong style={{ color: INK }} className="mono">{code}</strong> — {meaning}</div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 13, marginBottom: 12 }}>From the METAR, decode:</div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
        {probes.metarPicked.map((probe) => (
          <NumberField
            key={probe.id}
            label={probe.label}
            value={answers[probe.id] ?? ""}
            onChange={(v) => setAnswers((a) => ({ ...a, [probe.id]: v }))}
            unit={probe.unit}
            status={checked ? (resultById[probe.id]?.ok ? "correct" : "incorrect") : undefined}
          />
        ))}
      </div>
      <div style={{ fontSize: 13, marginBottom: 12 }}>From the TAF:</div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 8 }}>
        {probes.tafPicked.map((probe) => (
          <NumberField
            key={probe.id}
            label={probe.label}
            value={answers[probe.id] ?? ""}
            onChange={(v) => setAnswers((a) => ({ ...a, [probe.id]: v }))}
            unit={probe.unit}
            status={checked ? (resultById[probe.id]?.ok ? "correct" : "incorrect") : undefined}
          />
        ))}
      </div>

      <button
        onClick={() => setChecked(true)}
        className="chart-head"
        style={{ marginTop: 8, background: MAGENTA, color: "#F5F9F7", border: "none", borderRadius: 4, padding: "12px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
      >
        CHECK
      </button>
      {checked && (
        <ResultBanner correct={bothOk}>
          {bothOk ? (
            "Correct — within tolerance."
          ) : (
            <span>
              Some answers were off. Correct values:{" "}
              {results.filter((r) => !r.ok).map((r, i) => (
                <span key={r.id}>
                  {i > 0 ? ", " : ""}
                  {r.label} = {typeof r.correct === "number" && r.tol > 0 ? r.correct.toFixed(2) : r.correct}
                  {r.unit}
                </span>
              ))}
              .
            </span>
          )}
        </ResultBanner>
      )}
      <button
        onClick={() => setShowSolution((s) => !s)}
        className="mono"
        style={{ display: "block", marginTop: 24, fontSize: 11, color: CHART_BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
      >
        {showSolution ? "Hide worked solution" : "Show worked solution"}
      </button>
      {showSolution && (
        <div style={{ marginTop: 10, fontSize: 12, color: MUTED, lineHeight: 1.8 }}>
          <strong style={{ color: INK }}>Wind:</strong>{" "}
          {problem.windCalm ? "calm" : `${problem.windVRB ? "variable direction" : problem.windDir + "°"} at ${problem.windSpeed} kt${problem.gust ? `, gusting to ${problem.gust} kt` : ""}`}.<br />
          <strong style={{ color: INK }}>Visibility:</strong> {problem.visibilitySM} statute miles.<br />
          {problem.hasWx && (
            <><strong style={{ color: INK }}>Weather:</strong> {problem.wxIntensity === "-" ? "light" : problem.wxIntensity === "+" ? "heavy" : "moderate"} {problem.wxPhenom}.<br /></>
          )}
          <strong style={{ color: INK }}>Clouds:</strong> {problem.cloudCover1} at {problem.cloudBase1 * 100} ft AGL, {problem.cloudCover2} at {problem.cloudBase2 * 100} ft AGL
          {problem.hasThirdLayer && `, ${problem.cloudCover3} at ${problem.cloudBase3 * 100} ft AGL`} — the lowest BKN/OVC layer sets the ceiling.<br />
          <strong style={{ color: INK }}>Temperature/dewpoint:</strong> {problem.temp}°C / {problem.dewpoint}°C.<br />
          <strong style={{ color: INK }}>Altimeter:</strong> {problem.altimeterRaw} ÷ 100 = {(problem.altimeterRaw / 100).toFixed(2)} in Hg.<br />
          <br />
          <strong style={{ color: INK }}>TAF validity:</strong> from day {String(problem.day).padStart(2, "0")} at {problem.tafStart.hour}00Z to day {String(problem.tafEnd.day).padStart(2, "0")} at {problem.tafEnd.hour}00Z.<br />
          <strong style={{ color: INK }}>BECMG:</strong> change to {problem.becmgWindDir}° at {problem.becmgWindSpeed} kt, {problem.becmgVis} SM, beginning at {problem.becmgHour}00Z.
        </div>
      )}
    </div>
  );
}

export function CrosswindCalc({ onExit }) {
  const [problem, setProblem] = useState(genCrosswindProblem);
  const [hwAns, setHwAns] = useState("");
  const [xwAns, setXwAns] = useState("");
  const [sideAns, setSideAns] = useState(null); // "left" | "right" | null
  const [checked, setChecked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const newProblem = () => {
    setProblem(genCrosswindProblem());
    setHwAns("");
    setXwAns("");
    setSideAns(null);
    setChecked(false);
    setShowSolution(false);
  };

  const hwOk = hwAns !== "" && Math.abs(parseFloat(hwAns) - problem.headwind) <= 1.5;
  const xwOk = xwAns !== "" && Math.abs(parseFloat(xwAns) - problem.crosswind) <= 1.5;
  const sideOk = sideAns === problem.side;
  const bothOk = hwOk && xwOk && sideOk;

  return (
    <div className="paper-panel" style={{ borderRadius: 4, padding: 22 }}>
      <CalcHeader title="CROSSWIND COMPONENT" onNewProblem={newProblem} onExit={onExit} />
      <ApproachGuide
        steps={[
          "Find the angle between the wind direction and the runway heading — the runway number ×10 gives its magnetic heading (Runway 27 = 270°).",
          "Headwind component = wind speed × cos(angle). A positive result is a headwind; negative means it's actually a tailwind component.",
          "Crosswind component = wind speed × sin(angle). This is always a positive magnitude.",
          "The crosswind comes from whichever side the wind direction falls on relative to the runway heading — work out left or right by picturing yourself facing down the runway.",
        ]}
      />
      <div style={{ fontSize: 14, marginBottom: 18, lineHeight: 1.65 }}>
        Runway: <strong>{String(problem.runway).padStart(2, "0")}</strong> (heading {problem.runwayHdg}°)<br />
        Wind: <strong>{String(problem.windDir).padStart(3, "0")}° at {problem.windSpeed} kt</strong>
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
        <NumberField label="Headwind (+) / tailwind (−)" value={hwAns} onChange={setHwAns} unit="kt" status={checked ? (hwOk ? "correct" : "incorrect") : undefined} />
        <NumberField label="Crosswind component" value={xwAns} onChange={setXwAns} unit="kt" status={checked ? (xwOk ? "correct" : "incorrect") : undefined} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 6 }}>Crosswind is from which side?</label>
        <SelectButtons options={["left", "right"]} value={sideAns} onChange={setSideAns} checked={checked} correctValue={problem.side} />
      </div>
      <button
        onClick={() => setChecked(true)}
        className="chart-head"
        style={{ marginTop: 8, background: MAGENTA, color: "#F5F9F7", border: "none", borderRadius: 4, padding: "12px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
      >
        CHECK
      </button>
      {checked && (
        <ResultBanner correct={bothOk}>
          {bothOk
            ? "Correct — within tolerance."
            : `Correct answer: ${problem.headwind >= 0 ? "headwind" : "tailwind"} ${Math.abs(problem.headwind).toFixed(1)} kt, crosswind ${problem.crosswind.toFixed(1)} kt from the ${problem.side}.`}
        </ResultBanner>
      )}
      <button
        onClick={() => setShowSolution((s) => !s)}
        className="mono"
        style={{ display: "block", marginTop: 24, fontSize: 11, color: CHART_BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
      >
        {showSolution ? "Hide worked solution" : "Show worked solution"}
      </button>
      {showSolution && (
        <div style={{ marginTop: 10, fontSize: 12, color: MUTED, lineHeight: 1.7 }}>
          1. Angle between wind and runway = {String(problem.windDir).padStart(3, "0")}° − {problem.runwayHdg}° ≈ {problem.angle.toFixed(0)}°<br />
          2. Headwind = {problem.windSpeed} × cos({problem.angle.toFixed(0)}°) ≈ {problem.headwind.toFixed(1)} kt {problem.headwind >= 0 ? "(headwind)" : "(tailwind)"}<br />
          3. Crosswind = {problem.windSpeed} × sin({problem.angle.toFixed(0)}°) ≈ {problem.crosswind.toFixed(1)} kt, from the {problem.side}
        </div>
      )}
    </div>
  );
}

export function TasCalc({ onExit }) {
  const [problem, setProblem] = useState(genTasProblem);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const newProblem = () => {
    setProblem(genTasProblem());
    setAnswer("");
    setChecked(false);
    setShowSolution(false);
  };

  const correct = answer !== "" && Math.abs(parseFloat(answer) - problem.tas) <= 3;

  return (
    <div className="paper-panel" style={{ borderRadius: 4, padding: 22 }}>
      <CalcHeader title="TRUE AIRSPEED FROM CAS" onNewProblem={newProblem} onExit={onExit} />
      <ApproachGuide
        steps={[
          "Find density altitude first — same method as the Density Altitude calculator: PA + 120 ft for every °C above the ISA temperature at that altitude.",
          "Apply the rule of thumb: TAS increases roughly 2% over CAS for every 1,000 ft of density altitude.",
          "TAS = CAS × (1 + 0.02 × (density altitude ÷ 1,000)).",
          "A negative density altitude (cold, low-altitude days) means TAS comes out slightly below CAS — the correction works in both directions.",
        ]}
      />
      <div style={{ fontSize: 14, marginBottom: 18, lineHeight: 1.65 }}>
        Calibrated airspeed: <strong>{problem.cas} kt</strong><br />
        Pressure altitude: <strong>{problem.pa.toLocaleString()} ft</strong><br />
        Outside air temperature: <strong>{problem.oat}°C</strong>
      </div>
      <NumberField label="True airspeed" value={answer} onChange={setAnswer} unit="kt" status={checked ? (correct ? "correct" : "incorrect") : undefined} />
      <div>
        <button
          onClick={() => setChecked(true)}
          className="chart-head"
          style={{ marginTop: 16, background: MAGENTA, color: "#F5F9F7", border: "none", borderRadius: 4, padding: "12px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          CHECK
        </button>
      </div>
      {checked && (
        <ResultBanner correct={correct}>
          {correct ? "Correct — within tolerance." : `Correct answer: ≈ ${problem.tas.toFixed(1)} kt (±3 kt tolerance).`}
        </ResultBanner>
      )}
      <button
        onClick={() => setShowSolution((s) => !s)}
        className="mono"
        style={{ display: "block", marginTop: 24, fontSize: 11, color: CHART_BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
      >
        {showSolution ? "Hide worked solution" : "Show worked solution"}
      </button>
      {showSolution && (
        <div style={{ marginTop: 10, fontSize: 12, color: MUTED, lineHeight: 1.7 }}>
          1. ISA temperature at {problem.pa.toLocaleString()} ft = 15 − 2×({problem.pa}/1000) = {problem.isaTemp.toFixed(1)}°C<br />
          2. Density altitude = {problem.pa} + 120×({problem.oat} − {problem.isaTemp.toFixed(1)}) ≈ {problem.da.toFixed(0)} ft<br />
          3. TAS = {problem.cas} × (1 + 0.02×({problem.da.toFixed(0)}/1000)) ≈ {problem.tas.toFixed(1)} kt
        </div>
      )}
    </div>
  );
}

export function CGShiftCalc({ onExit }) {
  const [problem, setProblem] = useState(genCGShiftProblem);
  const [weightAns, setWeightAns] = useState("");
  const [cgAns, setCgAns] = useState("");
  const [shiftAns, setShiftAns] = useState(null); // "forward" | "aft" | null
  const [checked, setChecked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const newProblem = () => {
    setProblem(genCGShiftProblem());
    setWeightAns("");
    setCgAns("");
    setShiftAns(null);
    setChecked(false);
    setShowSolution(false);
  };

  const weightOk = weightAns !== "" && Math.abs(parseFloat(weightAns) - problem.w1) <= 5;
  const cgOk = cgAns !== "" && Math.abs(parseFloat(cgAns) - problem.cg1) <= 0.3;
  const shiftOk = shiftAns === problem.shift;
  const bothOk = weightOk && cgOk && shiftOk;

  return (
    <div className="paper-panel" style={{ borderRadius: 4, padding: 22 }}>
      <CalcHeader title="CG SHIFT ON LOAD CHANGE" onNewProblem={newProblem} onExit={onExit} />
      <ApproachGuide
        steps={[
          "Start from the given loaded weight and CG — that's the 'before' condition, already computed for you.",
          "Work out the new total weight after the change (add or subtract the item's weight).",
          "Work out the new total moment (add or subtract the item's weight × its arm), then divide by the new total weight to get the new CG.",
          "Compare the new CG to the old one: a larger arm value means further aft, so if CG increased, it shifted aft — if it decreased, it shifted forward.",
        ]}
      />
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 10, fontStyle: "italic" }}>
        Practice-only figures for a generic training aircraft — always use your own aircraft's actual POH for real flight planning.
      </div>

      <table style={{ width: "100%", fontSize: 12, marginBottom: 14, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${CONTOUR}66` }}>
            <th style={{ textAlign: "left", padding: "4px 0", color: MUTED, fontWeight: 600 }}>Item</th>
            <th style={{ textAlign: "right", padding: "4px 0", color: MUTED, fontWeight: 600 }}>Weight (lb)</th>
            <th style={{ textAlign: "right", padding: "4px 0", color: MUTED, fontWeight: 600 }}>Arm (in)</th>
          </tr>
        </thead>
        <tbody>
          {problem.items.map((i, idx) => (
            <tr key={idx} style={{ borderBottom: `1px solid ${CONTOUR}33` }}>
              <td style={{ padding: "4px 0" }}>{i.label}</td>
              <td style={{ textAlign: "right", padding: "4px 0" }}>{i.weight}</td>
              <td style={{ textAlign: "right", padding: "4px 0" }}>{i.arm.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontSize: 14, marginBottom: 18, lineHeight: 1.65 }}>
        Before: total weight <strong>{problem.w0} lb</strong>, CG <strong>{problem.cg0.toFixed(2)} in</strong><br />
        Change: <strong>{problem.direction === "remove" ? "removes" : "boards, adding"} {problem.changeWeight.toFixed(0)} lb</strong> at {problem.stationLabel} (arm {problem.stationArm.toFixed(1)} in)
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
        <NumberField label="New total weight" value={weightAns} onChange={setWeightAns} unit="lb" status={checked ? (weightOk ? "correct" : "incorrect") : undefined} />
        <NumberField label="New CG" value={cgAns} onChange={setCgAns} unit="in" status={checked ? (cgOk ? "correct" : "incorrect") : undefined} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 6 }}>Did CG move forward or aft?</label>
        <SelectButtons options={["forward", "aft"]} value={shiftAns} onChange={setShiftAns} checked={checked} correctValue={problem.shift} />
      </div>

      <button
        onClick={() => setChecked(true)}
        className="chart-head"
        style={{ marginTop: 8, background: MAGENTA, color: "#F5F9F7", border: "none", borderRadius: 4, padding: "12px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
      >
        CHECK
      </button>
      {checked && (
        <ResultBanner correct={bothOk}>
          {bothOk
            ? "Correct — within tolerance."
            : `Correct answer: new weight ${problem.w1} lb, new CG ${problem.cg1.toFixed(2)} in, shifted ${problem.shift}.`}
        </ResultBanner>
      )}
      <button
        onClick={() => setShowSolution((s) => !s)}
        className="mono"
        style={{ display: "block", marginTop: 24, fontSize: 11, color: CHART_BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
      >
        {showSolution ? "Hide worked solution" : "Show worked solution"}
      </button>
      {showSolution && (
        <div style={{ marginTop: 10, fontSize: 12, color: MUTED, lineHeight: 1.7 }}>
          1. Before: moment = {problem.w0} × {problem.cg0.toFixed(2)} ≈ {(problem.w0 * problem.cg0).toFixed(0)} lb-in<br />
          2. New weight = {problem.w0} {problem.direction === "remove" ? "−" : "+"} {problem.changeWeight.toFixed(0)} = {problem.w1} lb<br />
          3. New moment = {(problem.w0 * problem.cg0).toFixed(0)} {problem.direction === "remove" ? "−" : "+"} ({problem.changeWeight.toFixed(0)} × {problem.stationArm.toFixed(1)}) ≈ {(problem.w1 * problem.cg1).toFixed(0)} lb-in<br />
          4. New CG = {(problem.w1 * problem.cg1).toFixed(0)} ÷ {problem.w1} ≈ {problem.cg1.toFixed(2)} in — shifted <strong>{problem.shift}</strong> from {problem.cg0.toFixed(2)} in
        </div>
      )}
    </div>
  );
}

export function InstrumentCalc({ onExit }) {
  const [problem, setProblem] = useState(genInstrumentProblem);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const newProblem = () => {
    setProblem(genInstrumentProblem());
    setAnswers({});
    setChecked(false);
    setShowSolution(false);
  };

  const set = (key, val) => setAnswers((a) => ({ ...a, [key]: val }));

  let bothOk = false;
  if (problem.type === "asi") {
    const speedOk = answers.speed !== undefined && answers.speed !== "" && Math.abs(parseFloat(answers.speed) - problem.speed) <= 3;
    const bandOk = answers.band === problem.band;
    bothOk = speedOk && bandOk;
    var asiSpeedOk = speedOk, asiBandOk = bandOk;
  } else if (problem.type === "attitude") {
    const pitchOk = answers.pitch === problem.pitchCategory;
    const bankOk = answers.bank === problem.bankCategory;
    bothOk = pitchOk && bankOk;
    var aiPitchOk = pitchOk, aiBankOk = bankOk;
  } else {
    const turnOk = answers.turn === problem.turnKey;
    const ballOk = answers.ball === problem.ball;
    bothOk = turnOk && ballOk;
    var tcTurnOk = turnOk, tcBallOk = ballOk;
  }

  const title = problem.type === "asi" ? "Airspeed Indicator" : problem.type === "attitude" ? "Attitude Indicator" : "Turn Coordinator";

  return (
    <div className="paper-panel" style={{ borderRadius: 4, padding: 22 }}>
      <CalcHeader title="INSTRUMENT READING" onNewProblem={newProblem} onExit={onExit} />
      <ApproachGuide
        steps={[
          "This cycles between the airspeed indicator, attitude indicator, and turn coordinator — read whichever one comes up.",
          "Airspeed indicator: read the needle position, then check which colored arc it falls in.",
          "Attitude indicator: the small fixed aircraft symbol stays put — everything else (the horizon) moves to show your actual pitch and bank.",
          "Turn coordinator: the miniature aircraft shows rate and direction of turn — compare its wingtip to the reference dots for a standard-rate turn. The ball below shows whether the turn is coordinated.",
        ]}
      />
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 10, fontStyle: "italic" }}>
        Simplified, generic instrument faces for practice reading — not exact reproductions of any specific manufacturer's dial.
      </div>
      <div className="mono" style={{ fontSize: 11, color: MUTED, marginBottom: 10, letterSpacing: 0.5 }}>{title.toUpperCase()}</div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        {problem.type === "asi" && (
          <svg viewBox="0 0 200 200" width="200" height="200">
            <circle cx="100" cy="100" r="80" fill="#fff" stroke={CONTOUR} strokeWidth="2" />
            <path d={describeArc(100, 100, 68, -120 + (ASI_BANDS.whiteMin / 180) * 240, -120 + (ASI_BANDS.whiteMax / 180) * 240)} fill="none" stroke="#E4E4DC" strokeWidth="14" />
            <path d={describeArc(100, 100, 68, -120 + (ASI_BANDS.whiteMax / 180) * 240, -120 + (ASI_BANDS.greenMax / 180) * 240)} fill="none" stroke={OLIVE} strokeWidth="14" />
            <path d={describeArc(100, 100, 68, -120 + (ASI_BANDS.greenMax / 180) * 240, -120 + (ASI_BANDS.yellowMax / 180) * 240)} fill="none" stroke="#C9A227" strokeWidth="14" />
            {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180].map((s) => {
              const a = -120 + (s / 180) * 240;
              const outer = polarToXY(100, 100, 92, a);
              const inner = polarToXY(100, 100, 80, a);
              const label = polarToXY(100, 100, 60, a);
              return (
                <g key={s}>
                  <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={INK} strokeWidth="1.5" />
                  <text x={label.x} y={label.y + 3} textAnchor="middle" fontSize="9" fill={INK} fontFamily="JetBrains Mono, monospace">{s}</text>
                </g>
              );
            })}
            {(() => {
              const nEnd = polarToXY(100, 100, 62, -120 + (problem.speed / 180) * 240);
              return <line x1="100" y1="100" x2={nEnd.x} y2={nEnd.y} stroke={MAGENTA} strokeWidth="3" strokeLinecap="round" />;
            })()}
            <circle cx="100" cy="100" r="5" fill={INK} />
          </svg>
        )}

        {problem.type === "attitude" && (
          <svg viewBox="0 0 200 200" width="200" height="200">
            <defs>
              <clipPath id="aiClip"><circle cx="100" cy="100" r="80" /></clipPath>
            </defs>
            <g clipPath="url(#aiClip)">
              <g transform={`rotate(${problem.bank} 100 100) translate(0 ${problem.pitch * 2.5})`}>
                <rect x="-150" y="-350" width="500" height="450" fill={CHART_BLUE} />
                <rect x="-150" y="100" width="500" height="450" fill="#7A5C3E" />
                <line x1="-150" y1="100" x2="350" y2="100" stroke="#fff" strokeWidth="2" />
              </g>
            </g>
            <g>
              <rect x="55" y="97" width="35" height="6" rx="2" fill="#FFB020" stroke={INK} strokeWidth="1" />
              <rect x="110" y="97" width="35" height="6" rx="2" fill="#FFB020" stroke={INK} strokeWidth="1" />
              <circle cx="100" cy="100" r="4" fill="#FFB020" stroke={INK} strokeWidth="1" />
            </g>
            <circle cx="100" cy="100" r="80" fill="none" stroke={CONTOUR} strokeWidth="4" />
          </svg>
        )}

        {problem.type === "turn" && (
          <svg viewBox="0 0 200 110" width="220" height="121">
            <rect x="10" y="5" width="180" height="100" rx="6" fill={PAPER} stroke={CONTOUR} strokeWidth="2" />
            <circle cx="68.3" cy="54.8" r="3" fill={CONTOUR} />
            <circle cx="131.7" cy="54.8" r="3" fill={CONTOUR} />
            <g transform={`rotate(${problem.tilt} 100 40)`}>
              <line x1="65" y1="40" x2="135" y2="40" stroke={INK} strokeWidth="5" strokeLinecap="round" />
              <polygon points="100,25 94,40 106,40" fill={INK} />
            </g>
            <rect x="55" y="75" width="90" height="16" rx="8" fill="#fff" stroke={CONTOUR} strokeWidth="1.5" />
            <line x1="100" y1="75" x2="100" y2="91" stroke={CONTOUR} strokeWidth="1" />
            <circle cx={problem.ball === "left" ? 70 : problem.ball === "right" ? 130 : 100} cy="83" r="6" fill="#DDD" stroke={INK} strokeWidth="1.5" />
          </svg>
        )}
      </div>

      {problem.type === "asi" && (
        <>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
            <NumberField label="Indicated airspeed" value={answers.speed ?? ""} onChange={(v) => set("speed", v)} unit="kt" status={checked ? (asiSpeedOk ? "correct" : "incorrect") : undefined} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 6 }}>Which arc is the needle in?</label>
            <SelectButtons options={["white", "green", "yellow", "beyond red line"]} value={answers.band ?? null} onChange={(v) => set("band", v)} checked={checked} correctValue={problem.band} />
          </div>
        </>
      )}

      {problem.type === "attitude" && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 6 }}>Pitch?</label>
            <SelectButtons options={["climbing", "level", "descending"]} value={answers.pitch ?? null} onChange={(v) => set("pitch", v)} checked={checked} correctValue={problem.pitchCategory} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 6 }}>Bank?</label>
            <SelectButtons options={["left", "wings level", "right"]} value={answers.bank ?? null} onChange={(v) => set("bank", v)} checked={checked} correctValue={problem.bankCategory} />
          </div>
        </>
      )}

      {problem.type === "turn" && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 6 }}>Rate and direction of turn?</label>
            <SelectButtons
              options={["left-std", "left-half", "none", "right-half", "right-std"]}
              value={answers.turn ?? null}
              onChange={(v) => set("turn", v)}
              checked={checked}
              correctValue={problem.turnKey}
            />
            <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>std = standard rate, half = less than standard rate, none = wings level</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 6 }}>Ball position?</label>
            <SelectButtons options={["left", "centered", "right"]} value={answers.ball ?? null} onChange={(v) => set("ball", v)} checked={checked} correctValue={problem.ball} />
          </div>
        </>
      )}

      <button
        onClick={() => setChecked(true)}
        className="chart-head"
        style={{ marginTop: 8, background: MAGENTA, color: "#F5F9F7", border: "none", borderRadius: 4, padding: "12px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
      >
        CHECK
      </button>
      {checked && (
        <ResultBanner correct={bothOk}>
          {bothOk
            ? "Correct — within tolerance."
            : problem.type === "asi"
            ? `Correct answer: ${problem.speed} kt, ${problem.band} arc.`
            : problem.type === "attitude"
            ? `Correct answer: ${problem.pitchCategory}, banked ${problem.bankCategory}.`
            : `Correct answer: turning ${problem.turnLabel}, ball ${problem.ball}.`}
        </ResultBanner>
      )}
      <button
        onClick={() => setShowSolution((s) => !s)}
        className="mono"
        style={{ display: "block", marginTop: 24, fontSize: 11, color: CHART_BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
      >
        {showSolution ? "Hide worked solution" : "Show worked solution"}
      </button>
      {showSolution && (
        <div style={{ marginTop: 10, fontSize: 12, color: MUTED, lineHeight: 1.7 }}>
          {problem.type === "asi" && (
            <>The needle points to <strong>{problem.speed} kt</strong>. That falls {problem.band === "white" ? `below ${ASI_BANDS.whiteMax} kt, in the white flap-operating arc` : problem.band === "green" ? "in the green normal operating arc" : problem.band === "yellow" ? "in the yellow caution arc — normal operations only in smooth air" : "beyond the red line — never exceed speed, structural damage risk"}.</>
          )}
          {problem.type === "attitude" && (
            <>The horizon sits {problem.pitch === 0 ? "level with" : problem.pitch > 0 ? "below" : "above"} the fixed aircraft symbol, showing <strong>{problem.pitchCategory}</strong> flight ({problem.pitch}° from level). The horizon is tilted so its {problem.bank > 0 ? "right" : problem.bank < 0 ? "left" : "neither"} side is lower, showing a bank <strong>{problem.bankCategory}</strong> ({Math.abs(problem.bank)}°).</>
          )}
          {problem.type === "turn" && (
            <>The miniature aircraft's wingtip position shows <strong>{problem.turnLabel}</strong>. The ball is <strong>{problem.ball}</strong> of center — {problem.ball === "centered" ? "the turn is coordinated" : "step on the ball (apply rudder toward the low side) to bring it back to center and coordinate the turn"}.</>
          )}
        </div>
      )}
    </div>
  );
}
