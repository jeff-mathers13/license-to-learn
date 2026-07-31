// Pure-math problem generators for all 11 practice calculators (Instrument Reading's
// generator is included for parity with the live app, where that calculator is hidden
// from the UI but not deleted — see App.jsx for the commented-out registration).

import { shuffleArray } from "../data/questions";

export function genWindProblem() {
  const tc = Math.floor(Math.random() * 360);
  const tas = 80 + Math.floor(Math.random() * 71);
  const wd = Math.floor(Math.random() * 360);
  const ws = 5 + Math.floor(Math.random() * 31);
  const A = wd - tc;
  const Arad = (A * Math.PI) / 180;
  const wcaRad = Math.asin((ws / tas) * Math.sin(Arad));
  const wcaDeg = (wcaRad * 180) / Math.PI;
  const heading = (tc + wcaDeg + 360) % 360;
  const gs = tas * Math.cos(wcaRad) - ws * Math.cos(Arad);
  return { tc, tas, wd, ws, heading, gs, wcaDeg };
}

export function genDensityProblem() {
  const pa = Math.floor(Math.random() * 17) * 500;
  const oat = -10 + Math.floor(Math.random() * 46);
  const isaTemp = 15 - 2 * (pa / 1000);
  const da = pa + 120 * (oat - isaTemp);
  return { pa, oat, isaTemp, da };
}

export const WB_ENVELOPE = { minWeight: 1700, maxWeight: 2650, fwdAtMin: 39.5, fwdAtMax: 41.5, aftAtMin: 45.0, aftAtMax: 46.0 };

export function wbForwardLimit(weight) {
  const w = Math.max(WB_ENVELOPE.minWeight, Math.min(WB_ENVELOPE.maxWeight, weight));
  const frac = (w - WB_ENVELOPE.minWeight) / (WB_ENVELOPE.maxWeight - WB_ENVELOPE.minWeight);
  return WB_ENVELOPE.fwdAtMin + frac * (WB_ENVELOPE.fwdAtMax - WB_ENVELOPE.fwdAtMin);
}

export function wbAftLimit(weight) {
  const w = Math.max(WB_ENVELOPE.minWeight, Math.min(WB_ENVELOPE.maxWeight, weight));
  const frac = (w - WB_ENVELOPE.minWeight) / (WB_ENVELOPE.maxWeight - WB_ENVELOPE.minWeight);
  return WB_ENVELOPE.aftAtMin + frac * (WB_ENVELOPE.aftAtMax - WB_ENVELOPE.aftAtMin);
}

export function genWBProblem() {
  const emptyWeight = 1500 + Math.floor(Math.random() * 11) * 10;
  const frontWeight = 150 + Math.floor(Math.random() * 20) * 10;
  const rearWeight = Math.random() < 0.3 ? 0 : 100 + Math.floor(Math.random() * 25) * 10;
  const baggageWeight = Math.floor(Math.random() * 13) * 10;
  const fuelGal = 15 + Math.floor(Math.random() * 26);
  const fuelWeight = fuelGal * 6;
  const arms = { empty: 40.0, front: 37.0, rear: 73.0, baggage: 95.0, fuel: 48.0 };
  const items = [
    { label: "Empty weight", weight: emptyWeight, arm: arms.empty },
    { label: "Pilot + front passenger", weight: frontWeight, arm: arms.front },
    { label: "Rear passenger(s)", weight: rearWeight, arm: arms.rear },
    { label: "Baggage", weight: baggageWeight, arm: arms.baggage },
    { label: `Fuel (${fuelGal} gal @ 6 lb/gal)`, weight: fuelWeight, arm: arms.fuel },
  ];
  const totalWeight = items.reduce((a, i) => a + i.weight, 0);
  const totalMoment = items.reduce((a, i) => a + i.weight * i.arm, 0);
  const cg = totalMoment / totalWeight;
  const withinLimits =
    totalWeight >= WB_ENVELOPE.minWeight &&
    totalWeight <= WB_ENVELOPE.maxWeight &&
    cg >= wbForwardLimit(totalWeight) &&
    cg <= wbAftLimit(totalWeight);
  return { items, totalWeight, totalMoment, cg, withinLimits };
}

export const PERF_PA_ROWS = [0, 2000, 4000, 6000];

export const PERF_OAT_COLS = [0, 20, 40];

export function perfGroundRoll(pa, oat) {
  return 500 + pa * 0.04 + oat * 4 + (pa / 1000) * oat * 0.5;
}

export function perfObstacleDist(pa, oat) {
  return perfGroundRoll(pa, oat) * 1.65;
}

export function bilinearInterp(rows, cols, fn, paQ, oatQ) {
  let i = 0;
  while (i < rows.length - 2 && paQ > rows[i + 1]) i++;
  let j = 0;
  while (j < cols.length - 2 && oatQ > cols[j + 1]) j++;
  const pa0 = rows[i], pa1 = rows[i + 1];
  const oat0 = cols[j], oat1 = cols[j + 1];
  const q11 = fn(pa0, oat0), q21 = fn(pa1, oat0);
  const q12 = fn(pa0, oat1), q22 = fn(pa1, oat1);
  const tPA = (paQ - pa0) / (pa1 - pa0);
  const tOAT = (oatQ - oat0) / (oat1 - oat0);
  const top = q11 + tPA * (q21 - q11);
  const bottom = q12 + tPA * (q22 - q12);
  return { value: top + tOAT * (bottom - top), pa0, pa1, oat0, oat1, q11, q21, q12, q22, tPA, tOAT };
}

export function genPerfProblem() {
  const rowIdx = Math.floor(Math.random() * (PERF_PA_ROWS.length - 1));
  const paQuery = PERF_PA_ROWS[rowIdx] + 200 + Math.floor(Math.random() * (PERF_PA_ROWS[rowIdx + 1] - PERF_PA_ROWS[rowIdx] - 400));
  const colIdx = Math.floor(Math.random() * (PERF_OAT_COLS.length - 1));
  const oatQuery = PERF_OAT_COLS[colIdx] + 3 + Math.floor(Math.random() * (PERF_OAT_COLS[colIdx + 1] - PERF_OAT_COLS[colIdx] - 6));

  const grInterp = bilinearInterp(PERF_PA_ROWS, PERF_OAT_COLS, perfGroundRoll, paQuery, oatQuery);
  const obInterp = bilinearInterp(PERF_PA_ROWS, PERF_OAT_COLS, perfObstacleDist, paQuery, oatQuery);

  return {
    paQuery: Math.round(paQuery / 10) * 10,
    oatQuery,
    groundRoll: grInterp.value,
    obstacleDist: obInterp.value,
    grInterp,
    obInterp,
  };
}

export function genWeatherProblem() {
  const complexityRoll = Math.random();
  const complexity = complexityRoll < 0.3 ? "simple" : complexityRoll < 0.7 ? "moderate" : "complex";

  const coverage = ["SCT", "BKN", "OVC"][Math.floor(Math.random() * 3)];
  const base = (2 + Math.floor(Math.random() * 10)) * 5; // hundreds of feet: 10-55
  const tops = base + (2 + Math.floor(Math.random() * 14)) * 5; // adds 10-75

  const convChance = complexity === "simple" ? 0.15 : complexity === "moderate" ? 0.35 : 0.55;
  const convRoll = Math.random();
  const convective = convRoll < convChance * 0.7 ? "TCU" : convRoll < convChance ? "CB" : "";

  const hasSecondLayer = complexity === "complex" && Math.random() < 0.6;
  const coverage2 = hasSecondLayer ? ["BKN", "OVC"][Math.floor(Math.random() * 2)] : null;
  const base2 = hasSecondLayer ? tops + 10 + Math.floor(Math.random() * 20) * 5 : null;
  const tops2 = hasSecondLayer ? base2 + (2 + Math.floor(Math.random() * 10)) * 5 : null;

  const wxChance = complexity === "simple" ? 0.3 : complexity === "moderate" ? 0.6 : 0.85;
  const hasWx = Math.random() < wxChance;
  const wxOptions = [
    ["-", "RA"], ["", "RA"], ["-", "SHRA"], ["", "SHRA"], ["+", "TSRA"], ["", "TSRA"],
    ["-", "SN"], ["", "SN"], ["-", "DZ"], ["", "BR"], ["", "FG"], ["-", "FZRA"],
  ];
  const [wxIntensity, wxPhenom] = hasWx ? wxOptions[Math.floor(Math.random() * wxOptions.length)] : ["", ""];

  const visibilitySM = 1 + Math.floor(Math.random() * 6); // 1-6

  const hazardType = Math.random() < 0.5 ? "icing" : "turbulence";
  const hazardBase = (2 + Math.floor(Math.random() * 8)) * 5; // 10-45
  const hazardTops = hazardBase + (2 + Math.floor(Math.random() * 10)) * 5; // adds 10-55

  let hazardIntensity, hazardTypeLabel, hazardOptions;
  if (hazardType === "icing") {
    hazardOptions = ["LGT", "MOD", "SEV"];
    hazardIntensity = hazardOptions[Math.floor(Math.random() * 3)];
    hazardTypeLabel = ["RIME", "MXD", "CLR"][Math.floor(Math.random() * 3)];
  } else {
    hazardOptions = ["MOD", "SEV"];
    hazardIntensity = hazardOptions[Math.floor(Math.random() * 2)];
    hazardTypeLabel = complexity === "complex" && Math.random() < 0.4 ? "MECH" : "";
  }

  const freezingLevelHundreds = (4 + Math.floor(Math.random() * 18)) * 5; // 20-105

  return {
    complexity,
    coverage, base, tops, convective,
    hasSecondLayer, coverage2, base2, tops2,
    hasWx, wxIntensity, wxPhenom, visibilitySM,
    hazardType, hazardIntensity, hazardTypeLabel, hazardBase, hazardTops, hazardOptions,
    freezingLevelHundreds,
  };
}

export const WX_LEGEND = [
  ["SCT / BKN / OVC", "Scattered / broken / overcast cloud coverage"],
  ["TCU / CB", "Towering cumulus / cumulonimbus (convective cloud)"],
  ["Tops/Base", "Cloud tops and base, in hundreds of feet ASL"],
  ["-  /  (none)  /  +", "Light / moderate / heavy intensity prefix"],
  ["RA SHRA TSRA SN DZ BR FG FZRA", "Rain, rain showers, thunderstorm rain, snow, drizzle, mist, fog, freezing rain"],
  ["LGT / MOD / SEV", "Light / moderate / severe (icing or turbulence intensity)"],
  ["RIME / MXD / CLR", "Rime / mixed / clear icing type"],
  ["MECH", "Mechanical turbulence (terrain/surface-induced)"],
  ["FZLVL", "Freezing level — altitude where temperature crosses 0°C"],
];

export const METAR_STATIONS = ["CYYZ", "CYVR", "CYYC", "CYOW", "CYUL", "CYEG", "CYWG", "CYHZ"];

export function addHoursToDayHour(day, hour, addHours) {
  const total = (day - 1) * 24 + hour + addHours;
  return { day: (Math.floor(total / 24) % 28) + 1, hour: total % 24 };
}

export function genMetarTafProblem() {
  const station = METAR_STATIONS[Math.floor(Math.random() * METAR_STATIONS.length)];
  const day = 1 + Math.floor(Math.random() * 28);
  const hour = Math.floor(Math.random() * 24);

  const complexityRoll = Math.random();
  const complexity = complexityRoll < 0.3 ? "simple" : complexityRoll < 0.7 ? "moderate" : "complex";

  const windSpeed = 3 + Math.floor(Math.random() * 23);
  const windCalm = complexity === "simple" && Math.random() < 0.15;
  const windVRB = !windCalm && windSpeed <= 6 && Math.random() < 0.35;
  const windDir = windCalm ? 0 : (1 + Math.floor(Math.random() * 36)) * 10;
  const hasGust = !windCalm && Math.random() < (complexity === "complex" ? 0.55 : 0.35);
  const gust = hasGust ? windSpeed + 5 + Math.floor(Math.random() * 11) : null;

  const visibilitySM = 1 + Math.floor(Math.random() * 9);

  const wxChance = complexity === "simple" ? 0.15 : complexity === "moderate" ? 0.5 : 0.8;
  const hasWx = Math.random() < wxChance;
  const wxOptions = [["-", "RA"], ["", "RA"], ["-", "SHRA"], ["", "SHRA"], ["-", "SN"], ["", "BR"], ["", "FG"], ["+", "TSRA"]];
  const [wxIntensity, wxPhenom] = hasWx ? wxOptions[Math.floor(Math.random() * wxOptions.length)] : ["", ""];

  const cloudBase1 = 2 + Math.floor(Math.random() * 20);
  const cloudCover1 = ["FEW", "SCT", "BKN", "OVC"][Math.floor(Math.random() * 4)];
  const cloudBase2 = cloudBase1 + 10 + Math.floor(Math.random() * 20);
  const cloudCover2 = ["SCT", "BKN", "OVC"][Math.floor(Math.random() * 3)];
  const hasThirdLayer = complexity === "complex" && Math.random() < 0.6;
  const cloudBase3 = hasThirdLayer ? cloudBase2 + 15 + Math.floor(Math.random() * 25) : null;
  const cloudCover3 = hasThirdLayer ? ["BKN", "OVC"][Math.floor(Math.random() * 2)] : null;
  const convective3 = hasThirdLayer && Math.random() < 0.4 ? (Math.random() < 0.5 ? "CB" : "TCU") : "";

  const temp = -10 + Math.floor(Math.random() * 35);
  const dewpoint = temp - (1 + Math.floor(Math.random() * 8));

  const altimeterRaw = 2892 + Math.floor(Math.random() * 151);

  const hasRmk = complexity === "complex" && Math.random() < 0.6;
  const slp = 950 + Math.floor(Math.random() * 800); // decorative only, not a question target

  // TAF: variable validity length, so start/end hours are genuinely different.
  const validityHours = [12, 18, 24, 30][Math.floor(Math.random() * 4)];
  const tafStart = { day, hour: Math.floor(hour / 6) * 6 };
  const tafEnd = addHoursToDayHour(tafStart.day, tafStart.hour, validityHours);
  const becmgHour = (tafStart.hour + 4 + Math.floor(Math.random() * (validityHours - 6))) % 24;
  const becmgWindDir = (1 + Math.floor(Math.random() * 36)) * 10;
  const becmgWindSpeed = 5 + Math.floor(Math.random() * 20);
  const becmgVis = 1 + Math.floor(Math.random() * 6);

  const fmt2 = (n) => String(n).padStart(2, "0");
  const fmt3 = (n) => String(n).padStart(3, "0");
  const fmtTemp = (t) => (t < 0 ? "M" + fmt2(Math.abs(t)) : fmt2(t));

  const windStr = windCalm
    ? "00000KT"
    : `${windVRB ? "VRB" : fmt3(windDir)}${fmt2(windSpeed)}${gust ? "G" + fmt2(gust) : ""}KT`;
  const wxStr = hasWx ? ` ${wxIntensity}${wxPhenom}` : "";
  const thirdLayerStr = hasThirdLayer ? ` ${cloudCover3}${fmt3(cloudBase3)}${convective3}` : "";
  const rmkStr = hasRmk ? ` RMK SLP${slp % 1000}` : "";
  const metarLine = `METAR ${station} ${fmt2(day)}${fmt2(hour)}00Z ${windStr} ${visibilitySM}SM${wxStr} ${cloudCover1}${fmt3(cloudBase1)} ${cloudCover2}${fmt3(cloudBase2)}${thirdLayerStr} ${fmtTemp(temp)}/${fmtTemp(dewpoint)} A${altimeterRaw}${rmkStr}`;

  const tafLine = `TAF ${station} ${fmt2(day)}${fmt2(hour)}00Z ${fmt2(tafStart.day)}${fmt2(tafStart.hour)}/${fmt2(tafEnd.day)}${fmt2(tafEnd.hour)} ${windStr} P6SM ${cloudCover1}${fmt3(cloudBase1 + 5)}\nBECMG ${fmt2(day)}${fmt2(becmgHour)}/${fmt2(day)}${fmt2((becmgHour + 2) % 24)} ${fmt3(becmgWindDir)}${fmt2(becmgWindSpeed)}KT ${becmgVis}SM`;

  return {
    station, day, hour, complexity,
    windDir, windSpeed, windCalm, windVRB, gust, visibilitySM, hasWx, wxIntensity, wxPhenom,
    cloudBase1, cloudCover1, cloudBase2, cloudCover2, hasThirdLayer, cloudBase3, cloudCover3,
    temp, dewpoint, altimeterRaw,
    tafStart, tafEnd, becmgHour, becmgWindDir, becmgWindSpeed, becmgVis,
    metarLine, tafLine,
  };
}

export const METAR_LEGEND = [
  ["DDHHMMZ", "Day, hour, minute of observation, in UTC (Zulu) time"],
  ["dddssKT / dddssGggKT", "Wind direction (°) and speed (kt); G marks gusts"],
  ["VRB / 00000KT", "VRB means variable direction (light and shifting wind); 00000KT means calm"],
  ["#SM", "Visibility in statute miles"],
  ["FEW / SCT / BKN / OVC + height", "Cloud coverage and base height in hundreds of feet AGL"],
  ["temp/dewpoint", "Whole °C, separated by a slash; an M prefix means negative (M06 = -6°C)"],
  ["A####", "Altimeter setting — divide by 100 for inches of Hg (A2992 = 29.92 in Hg)"],
  ["RMK SLP###", "Remarks section — SLP gives sea-level pressure, not usually needed for basic decoding"],
  ["TAF validity DDHH/DDHH", "Forecast period: from this day/hour to that day/hour, in UTC — length can vary"],
  ["BECMG", "A gradual change to new conditions expected within the stated period"],
];

export function genFuelProblem() {
  const distance = 50 + Math.floor(Math.random() * 21) * 10;
  const groundspeed = 90 + Math.floor(Math.random() * 11) * 5;
  const burnRate = 7 + Math.random() * 4;
  const isNight = Math.random() < 0.5;
  const reserveMinutes = isNight ? 45 : 30; // CAR 602.88: 30 min day VFR, 45 min night VFR
  const flightTimeMinutes = (distance / groundspeed) * 60;
  const totalMinutes = flightTimeMinutes + reserveMinutes;
  const fuelRequired = (totalMinutes / 60) * burnRate;
  return { distance, groundspeed, burnRate, isNight, reserveMinutes, flightTimeMinutes, fuelRequired };
}

export function buildWeatherProbes(p) {
  const numericProbes = [
    { id: "cloudBase", label: "Cloud base", unit: "ft ASL", correct: p.base * 100, tol: 50 },
    { id: "cloudTops", label: "Cloud tops", unit: "ft ASL", correct: p.tops * 100, tol: 50 },
    { id: "visibility", label: "Visibility", unit: "SM", correct: p.visibilitySM, tol: 0 },
    { id: "hazardBase", label: `${p.hazardType === "icing" ? "Icing" : "Turbulence"} layer base`, unit: "ft ASL", correct: p.hazardBase * 100, tol: 50 },
    { id: "hazardTop", label: `${p.hazardType === "icing" ? "Icing" : "Turbulence"} layer top`, unit: "ft ASL", correct: p.hazardTops * 100, tol: 50 },
    { id: "freezingLevel", label: "Freezing level", unit: "ft ASL", correct: p.freezingLevelHundreds * 100, tol: 50 },
  ];
  if (p.hasSecondLayer) {
    numericProbes.push({ id: "cloudBase2", label: "Second cloud layer base", unit: "ft ASL", correct: p.base2 * 100, tol: 50 });
    numericProbes.push({ id: "cloudTops2", label: "Second cloud layer tops", unit: "ft ASL", correct: p.tops2 * 100, tol: 50 });
  }
  const picked = shuffleArray(numericProbes).slice(0, Math.min(4, numericProbes.length));
  return picked;
}

export function buildMetarTafProbes(p) {
  const metarProbes = [];
  if (!p.windCalm && !p.windVRB) {
    metarProbes.push({ id: "windDir", label: "Wind direction", unit: "°", correct: p.windDir, tol: 0 });
  }
  metarProbes.push({ id: "windSpeed", label: "Wind speed", unit: "kt", correct: p.windSpeed, tol: 0 });
  if (p.gust) {
    metarProbes.push({ id: "gust", label: "Gust speed", unit: "kt", correct: p.gust, tol: 0 });
  }
  metarProbes.push({ id: "visibility", label: "Visibility", unit: "SM", correct: p.visibilitySM, tol: 0 });
  metarProbes.push({ id: "cloudBase1", label: "Lowest cloud layer base", unit: "ft AGL", correct: p.cloudBase1 * 100, tol: 0 });
  metarProbes.push({ id: "cloudBase2", label: "Second cloud layer base", unit: "ft AGL", correct: p.cloudBase2 * 100, tol: 0 });
  if (p.hasThirdLayer) {
    metarProbes.push({ id: "cloudBase3", label: "Third cloud layer base", unit: "ft AGL", correct: p.cloudBase3 * 100, tol: 0 });
  }
  metarProbes.push({ id: "temp", label: "Temperature", unit: "°C", correct: p.temp, tol: 0 });
  metarProbes.push({ id: "dewpoint", label: "Dewpoint", unit: "°C", correct: p.dewpoint, tol: 0 });
  metarProbes.push({ id: "altimeter", label: "Altimeter setting", unit: "in Hg", correct: p.altimeterRaw / 100, tol: 0.02 });

  const tafProbes = [
    { id: "tafStartHour", label: "TAF valid FROM hour", unit: "UTC", correct: p.tafStart.hour, tol: 0 },
    { id: "tafEndHour", label: "TAF valid TO hour", unit: "UTC", correct: p.tafEnd.hour, tol: 0 },
    { id: "becmgHour", label: "BECMG begins at hour", unit: "UTC", correct: p.becmgHour, tol: 0 },
    { id: "becmgWindSpeed", label: "BECMG wind speed", unit: "kt", correct: p.becmgWindSpeed, tol: 0 },
    { id: "becmgVis", label: "BECMG visibility", unit: "SM", correct: p.becmgVis, tol: 0 },
  ];

  const metarPicked = shuffleArray(metarProbes).slice(0, Math.min(4, metarProbes.length));
  const tafPicked = shuffleArray(tafProbes).slice(0, 2);
  return { metarPicked, tafPicked };
}

export function polarToXY(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

export function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToXY(cx, cy, r, startAngle);
  const end = polarToXY(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export const ASI_BANDS = { whiteMin: 40, whiteMax: 85, greenMax: 140, yellowMax: 165 };

export function asiBand(speed) {
  if (speed < ASI_BANDS.whiteMax) return "white";
  if (speed < ASI_BANDS.greenMax) return "green";
  if (speed < ASI_BANDS.yellowMax) return "yellow";
  return "beyond red line";
}

export function genInstrumentProblem() {
  const roll = Math.random();
  const type = roll < 0.34 ? "asi" : roll < 0.67 ? "attitude" : "turn";

  if (type === "asi") {
    const speed = 40 + Math.round((Math.random() * 135) / 5) * 5; // 40-175, multiples of 5
    return { type, speed, band: asiBand(speed) };
  }

  if (type === "attitude") {
    const bankOptions = [-45, -30, -20, -10, 0, 10, 20, 30, 45]; // positive = right bank
    const pitchOptions = [-15, -10, -5, 0, 5, 10, 15]; // positive = nose up / climbing
    const bank = bankOptions[Math.floor(Math.random() * bankOptions.length)];
    const pitch = pitchOptions[Math.floor(Math.random() * pitchOptions.length)];
    const pitchCategory = pitch > 0 ? "climbing" : pitch < 0 ? "descending" : "level";
    const bankCategory = bank > 0 ? "right" : bank < 0 ? "left" : "wings level";
    return { type, bank, pitch, pitchCategory, bankCategory };
  }

  // turn coordinator
  const turnOptions = [
    { key: "left-std", label: "left, standard rate", tilt: -25 },
    { key: "left-half", label: "left, less than standard rate", tilt: -12 },
    { key: "none", label: "wings level / no turn", tilt: 0 },
    { key: "right-half", label: "right, less than standard rate", tilt: 12 },
    { key: "right-std", label: "right, standard rate", tilt: 25 },
  ];
  const turn = turnOptions[Math.floor(Math.random() * turnOptions.length)];
  const ballOptions = ["left", "centered", "right"];
  const ball = ballOptions[Math.floor(Math.random() * ballOptions.length)];
  return { type, turnKey: turn.key, turnLabel: turn.label, tilt: turn.tilt, ball };
}

export function genCrosswindProblem() {
  const runway = 1 + Math.floor(Math.random() * 36);
  const runwayHdg = runway * 10;
  let windDir, windSpeed, angle, rawDiff;
  do {
    windDir = Math.floor(Math.random() * 36) * 10;
    windSpeed = 5 + Math.floor(Math.random() * 31);
    rawDiff = (windDir - runwayHdg + 360) % 360;
    angle = rawDiff <= 180 ? rawDiff : 360 - rawDiff;
  } while ((angle >= 85 && angle <= 95) || angle <= 5 || angle >= 175); // avoid ambiguous near-90 (headwind/tailwind unclear) and near-0/180 (crosswind unclear) cases
  const angleRad = (angle * Math.PI) / 180;
  const headwind = windSpeed * Math.cos(angleRad); // positive = headwind, negative = tailwind
  const crosswind = windSpeed * Math.sin(angleRad); // always >= 0
  const side = rawDiff <= 180 ? "right" : "left";
  return { runway, runwayHdg, windDir, windSpeed, headwind, crosswind, side, angle };
}

export function genTasProblem() {
  const cas = 70 + Math.floor(Math.random() * 71);
  const pa = Math.floor(Math.random() * 21) * 500; // 0-10,000
  const oat = -15 + Math.floor(Math.random() * 46); // -15 to 30
  const isaTemp = 15 - 2 * (pa / 1000);
  const da = pa + 120 * (oat - isaTemp);
  const tas = cas * (1 + 0.02 * (da / 1000));
  return { cas, pa, oat, isaTemp, da, tas };
}

export function genCGShiftProblem() {
  const emptyWeight = 1500 + Math.floor(Math.random() * 11) * 10;
  const emptyArm = round1(40.0 + (Math.random() * 3 - 1.5));
  const frontWeight = 150 + Math.floor(Math.random() * 20) * 10;
  const frontArm = round1(37.0 + (Math.random() * 3 - 1.5));
  const rearWeight = 100 + Math.floor(Math.random() * 25) * 10;
  const rearArm = round1(73.0 + (Math.random() * 3 - 1.5));
  const baggageWeight = 20 + Math.floor(Math.random() * 11) * 10;
  const baggageArm = round1(95.0 + (Math.random() * 3 - 1.5));
  const fuelGal = 15 + Math.floor(Math.random() * 26);
  const fuelWeight = fuelGal * 6;
  const fuelArm = round1(48.0 + (Math.random() * 3 - 1.5));

  const items = [
    { label: "Empty weight", weight: emptyWeight, arm: emptyArm },
    { label: "Pilot + front passenger", weight: frontWeight, arm: frontArm },
    { label: "Rear passenger(s)", weight: rearWeight, arm: rearArm },
    { label: "Baggage", weight: baggageWeight, arm: baggageArm },
    { label: `Fuel (${fuelGal} gal @ 6 lb/gal)`, weight: fuelWeight, arm: fuelArm },
  ];
  const w0 = items.reduce((a, i) => a + i.weight, 0);
  const m0 = items.reduce((a, i) => a + i.weight * i.arm, 0);
  const cg0 = m0 / w0;

  const station = Math.random() < 0.5 ? "rear" : "baggage";
  const direction = Math.random() < 0.5 ? "remove" : "add";
  const stationWeight = station === "rear" ? rearWeight : baggageWeight;
  const stationArm = station === "rear" ? rearArm : baggageArm;
  const stationLabel = station === "rear" ? "the rear passenger(s)" : "the baggage";

  let changeWeight, w1, m1;
  if (direction === "remove") {
    changeWeight = stationWeight;
    w1 = w0 - changeWeight;
    m1 = m0 - changeWeight * stationArm;
  } else {
    changeWeight = 20 + Math.round(Math.random() * 6) * 10; // extra 20-80 lb at the same station
    w1 = w0 + changeWeight;
    m1 = m0 + changeWeight * stationArm;
  }
  const cg1 = m1 / w1;
  const shift = cg1 > cg0 ? "aft" : cg1 < cg0 ? "forward" : "unchanged";

  return { items, w0, cg0, station, stationLabel, stationArm, direction, changeWeight, w1, cg1, shift };
}

export function round1(n) {
  return Math.round(n * 10) / 10;
}
