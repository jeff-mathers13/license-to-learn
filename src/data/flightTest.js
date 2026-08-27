// Structure for the PPL Flight Test prep section: the topic blocks the oral drill is
// organized into, the "My Aircraft" card fields, the pre-test checklist, and the two
// mock planning assignments.
//
// This is a DIFFERENT test from the PPAER. The PPAER is closed-book multiple choice
// scored against a pass mark; the flight test oral is open-book and conversational, so
// nothing here is scored right/wrong. The drill is self-rated (see lib/flightTest.js)
// and every answer carries a source pointer, because the skill actually being tested is
// producing a defensible answer and knowing where it came from.
//
// Source: Glacier Air "PPL Flight Test Preparation" (10 pp.), transcribed Aug 2026.

export const FT_SECTIONS = [
  { id: "docs", title: "Documents & Airworthiness", blurb: "The seven required documents, their validity, and minimum equipment." },
  { id: "maint", title: "Maintenance & Snags", blurb: "Inspection schedules, ADs, and how defects get recorded and deferred." },
  { id: "perf", title: "Aircraft Performance", blurb: "V-speed memory items, takeoff and landing distances, fuel burn, stable approach." },
  { id: "wb", title: "Weight & Balance", blurb: "Loading, datum and CG, and what the utility category buys you." },
  { id: "systems", title: "Aircraft Systems", blurb: "The thirteen systems you're expected to explain in practical terms." },
  { id: "airports", title: "Airport Knowledge", blurb: "CYCD, CYPU, CYHE and CYYJ — services, circuits, frequencies, procedures." },
  { id: "charts", title: "Charts & Route Selection", blurb: "Reading the VNC and VTA, and picking a route you've never flown." },
  { id: "cruise", title: "Cruise & Altitude", blurb: "Cruising altitude orders, minimum altitudes, VFR minima, diversions." },
  { id: "weather", title: "Weather", blurb: "GFA, TAF, METAR, FB and the go/no-go decision they add up to." },
  { id: "flightplan", title: "Flight Plan & Itinerary", blurb: "Filing, opening, closing, and the ICAO VFR form itself." },
  { id: "emerg", title: "Emergencies", blurb: "Twenty-two vital-action scenarios, cross-referenced to the POH." },
  { id: "radio", title: "Radio, SVFR & Interception", blurb: "Frequencies, FISE, radio failure, light signals, Special VFR." },
];

// The three self-assessment ratings. Deliberately not right/wrong — in an open-book oral
// the useful signal is "could I produce and defend this on the spot", which only you know.
export const FT_RATINGS = [
  { key: "confident", label: "Confident", short: "OK" },
  { key: "shaky", label: "Shaky", short: "~" },
  { key: "unknown", label: "No idea", short: "?" },
];

// Values that are specific to YOUR airplane, YOUR paperwork, or YOUR currency, and so
// cannot ship as canned answers. Filled once in the My Aircraft card; the drill then
// splices them into the answers of any question that lists the field id in `fields`.
export const AIRCRAFT_FIELD_GROUPS = [
  {
    id: "identity",
    title: "Identity",
    note: "From the Certificate of Registration and the POH title page.",
    fields: [
      { id: "registration", label: "Registration", placeholder: "C-GXXX" },
      { id: "model", label: "Make / model / year", placeholder: "Cessna 172N, 1978" },
      { id: "serial", label: "Serial number", placeholder: "17271234" },
      { id: "engine", label: "Engine", placeholder: "Lycoming O-320-H2AD, 160 hp" },
      { id: "prop", label: "Propeller", placeholder: "McCauley fixed-pitch, 75 in" },
    ],
  },
  {
    id: "weights",
    title: "Weights & Balance",
    note: "From the current Weight and Balance report — not the POH sample, the real one for this tail number.",
    fields: [
      { id: "bew", label: "Basic empty weight", unit: "lb" },
      { id: "bewArm", label: "Empty weight CG / arm", unit: "in" },
      { id: "bewMoment", label: "Empty weight moment", unit: "lb-in" },
      { id: "mtow", label: "Max gross weight (normal)", unit: "lb" },
      { id: "mtowUtility", label: "Max gross weight (utility)", unit: "lb" },
      { id: "usefulLoad", label: "Useful load", unit: "lb" },
      { id: "maxBag1", label: "Max baggage area 1", unit: "lb" },
      { id: "maxBag2", label: "Max baggage area 2", unit: "lb" },
      { id: "maxBagTotal", label: "Max baggage combined", unit: "lb" },
      { id: "datum", label: "Datum location", placeholder: "Front face of firewall" },
      { id: "cgFwd", label: "Forward CG limit", unit: "in" },
      { id: "cgAft", label: "Aft CG limit", unit: "in" },
      { id: "weighDate", label: "Last weighed", placeholder: "YYYY-MM-DD" },
    ],
  },
  {
    id: "fuel",
    title: "Fuel",
    note: "POH Section 1 (General) and Section 5 (Performance).",
    fields: [
      { id: "fuelUsable", label: "Total usable fuel", unit: "USG" },
      { id: "fuelUnusable", label: "Unusable fuel", unit: "USG" },
      { id: "fuelGrade", label: "Approved fuel grade", placeholder: "100LL (blue)" },
      { id: "fuelStartTaxi", label: "Start, taxi & runup allowance", unit: "USG" },
      { id: "fuelCruise", label: "Cruise burn at planned power", unit: "USG/hr" },
      { id: "fuelClimb", label: "Climb burn", unit: "USG/hr" },
    ],
  },
  {
    id: "speeds",
    title: "V-Speeds (memory items)",
    note: "POH Section 1 and Section 4. These are the ones the examiner expects without opening a book.",
    fields: [
      { id: "vx", label: "Vx — best angle of climb", unit: "KIAS" },
      { id: "vy", label: "Vy — best rate of climb", unit: "KIAS" },
      { id: "vaHigh", label: "Va at max gross", unit: "KIAS" },
      { id: "vaMid", label: "Va at mid weight", unit: "KIAS" },
      { id: "vaLow", label: "Va at light weight", unit: "KIAS" },
      { id: "vfe", label: "Vfe — max flap extended (full)", unit: "KIAS" },
      { id: "vfePartial", label: "Vfe — first stage of flap", unit: "KIAS" },
      { id: "vno", label: "Vno — max structural cruise", unit: "KIAS" },
      { id: "vne", label: "Vne — never exceed", unit: "KIAS" },
      { id: "vs", label: "Vs — stall, clean", unit: "KIAS" },
      { id: "vso", label: "Vso — stall, landing config", unit: "KIAS" },
      { id: "bestGlide", label: "Best glide", unit: "KIAS" },
      { id: "vr", label: "Rotation speed", unit: "KIAS" },
      { id: "climb50", label: "50 ft obstacle climb-out", unit: "KIAS" },
      { id: "apprNormal", label: "Final approach — normal", unit: "KIAS" },
      { id: "apprShort", label: "Final approach — short field", unit: "KIAS" },
      { id: "apprSoft", label: "Final approach — soft field", unit: "KIAS" },
    ],
  },
  {
    id: "limits",
    title: "Limits & Settings",
    note: "POH Section 2 (Limitations) and Section 4 (Normal Procedures).",
    fields: [
      { id: "xwind", label: "Max demonstrated crosswind", unit: "kt" },
      { id: "flapTakeoff", label: "Max approved flap for takeoff", unit: "deg" },
      { id: "flapMax", label: "Max flap deflection", unit: "deg" },
      { id: "staticRPM", label: "Min static takeoff RPM", unit: "RPM" },
      { id: "loadNormal", label: "Load factor limits (normal)", placeholder: "+3.8 / -1.52 g" },
      { id: "loadUtility", label: "Load factor limits (utility)", placeholder: "+4.4 / -1.76 g" },
    ],
  },
  {
    id: "currency",
    title: "Paperwork & Currency",
    note: "Your documents and the aircraft's. The examiner will ask for the actual dates.",
    fields: [
      { id: "insuranceExpiry", label: "Insurance expiry", placeholder: "YYYY-MM-DD" },
      { id: "medicalExpiry", label: "Your medical expiry", placeholder: "YYYY-MM-DD" },
      { id: "medicalCategory", label: "Your medical category", placeholder: "Category 3" },
      { id: "adbExpiry", label: "Aviation Document Booklet expiry", placeholder: "YYYY-MM-DD" },
      { id: "nextInspection", label: "Next inspection due at", placeholder: "e.g. 3421.5 air time" },
      { id: "inspectionType", label: "Which inspection is next", placeholder: "100 hr / annual" },
      { id: "lastSnag", label: "Most recent recorded defect", placeholder: "What it was, and how it was cleared" },
    ],
  },
];

export const ALL_AIRCRAFT_FIELDS = AIRCRAFT_FIELD_GROUPS.flatMap((g) =>
  g.fields.map((f) => ({ ...f, group: g.id, groupTitle: g.title })),
);

export const AIRCRAFT_FIELD_BY_ID = Object.fromEntries(ALL_AIRCRAFT_FIELDS.map((f) => [f.id, f]));

// The prep checklist from p.10, verbatim. Three columns because the same twenty items get
// worked three times: once for each ground-brief assignment, once for the test itself.
export const FT_CHECKLIST_COLUMNS = [
  { id: "a1", label: "Assignment 1" },
  { id: "a2", label: "Assignment 2" },
  { id: "test", label: "Flight Test" },
];

export const FT_CHECKLIST_ROWS = [
  { id: "vnc", label: "VNC Prepared" },
  { id: "vta", label: "VTA Prepared" },
  { id: "cfs", label: "CFS Pages" },
  { id: "metartaf", label: "METARs and TAFs Checked" },
  { id: "gfa6", label: "GFAs x 6 checked" },
  { id: "gfalocal", label: "Local GFA checked" },
  { id: "bcvfr", label: "BC VFR Route Forecast checked" },
  { id: "routegfa", label: "Route of Flight Drawn on GFA" },
  { id: "notams", label: "NOTAMs/PIREPs/SIGMETs" },
  { id: "webcams", label: "Webcams Checked" },
  { id: "upperwinds", label: "Upper Winds Checked" },
  { id: "navlog1", label: "Nav Log 1 Prepared" },
  { id: "navlog2", label: "Nav Log 2 Prepared" },
  { id: "groundspeed", label: "Ground Speed Checks" },
  { id: "freqs", label: "En Route and Arrival Frequencies" },
  { id: "wb", label: "Weight and Balance" },
  { id: "takeoffdist", label: "Takeoff Distance" },
  { id: "landingdist", label: "Landing Distance" },
  { id: "icao", label: "ICAO Flight Plan Form" },
  { id: "briefer", label: "Weather Briefer Called" },
];

// Prerequisites listed on p.9 for the first ground brief — the things that must be done
// before either assignment counts as ready.
export const FT_ASSIGNMENT_PREREQS = [
  "VNC and VTA maps prepared — route of flight, 10 degree drift lines, checkpoints, top of climb, top of descent, knowledge of airspace",
  "2 navigation logs completed including wind correction and ground speed checks",
  "One ICAO VFR Flight Plan Form filled out for the entire trip",
  "Familiarity with the airport procedures from the CFS",
  "Familiarity with potential diversion airports",
  "Weight and balance report completed",
  "Complete weather package and weather analysis for the proposed time of flight",
  "Takeoff and landing distances calculated",
];

// The two mock planning assignments from p.9. `outputs` are the numbers you're expected to
// arrive at and be able to defend — they're recorded rather than checked, since the right
// answer depends on the day's weather and your aircraft's real W&B.
export const FT_ASSIGNMENTS = [
  {
    id: "a1",
    title: "Assignment 1",
    brief:
      "You will depart from Squamish Airpark CYSE with 2 females, one child, and one bag on a sightseeing flight to Courtney Airpark CAH3. Plan for a one hour stopover before continuing to Victoria International CYYJ.",
    task: "Calculate the takeoff distance out of Squamish and the landing distance at Courtney Airpark over a 50' obstacle.",
    legs: ["CYSE → CAH3", "CAH3 → CYYJ"],
    outputs: [
      { id: "pax", label: "Load — occupants & baggage", placeholder: "2 F + 1 child + bag, weights used" },
      { id: "tow", label: "Takeoff weight", unit: "lb" },
      { id: "cg", label: "CG at takeoff", unit: "in" },
      { id: "cgLanding", label: "CG at landing", unit: "in" },
      { id: "fuelOnBoard", label: "Fuel on board", unit: "USG" },
      { id: "takeoffDist", label: "Takeoff distance, CYSE", unit: "ft" },
      { id: "landingDist", label: "Landing distance over 50' obstacle, CAH3", unit: "ft" },
      { id: "cruiseAlt", label: "Planned cruise altitude", unit: "ft" },
      { id: "ete", label: "Total ETE", placeholder: "h:mm" },
      { id: "diversion", label: "Diversion airports identified", placeholder: "" },
    ],
  },
  {
    id: "a2",
    title: "Assignment 2",
    brief:
      "You will depart from Squamish CYSE and pick up 1 male and 1 female in Hope CYHE. They will bring a 75 lbs bag with them. Plan for a 45 minute stopover before taking them to Kamloops CYKA.",
    task: "Calculate the landing and takeoff distances at Hope over a 50' obstacle.",
    legs: ["CYSE → CYHE", "CYHE → CYKA"],
    outputs: [
      { id: "pax", label: "Load — occupants & baggage", placeholder: "1 M + 1 F + 75 lb bag, weights used" },
      { id: "tow", label: "Takeoff weight, CYHE leg", unit: "lb" },
      { id: "cg", label: "CG at takeoff, CYHE", unit: "in" },
      { id: "cgLanding", label: "CG at landing, CYKA", unit: "in" },
      { id: "fuelOnBoard", label: "Fuel on board", unit: "USG" },
      { id: "landingDist", label: "Landing distance over 50' obstacle, CYHE", unit: "ft" },
      { id: "takeoffDist", label: "Takeoff distance over 50' obstacle, CYHE", unit: "ft" },
      { id: "cruiseAlt", label: "Planned cruise altitude", unit: "ft" },
      { id: "ete", label: "Total ETE", placeholder: "h:mm" },
      { id: "diversion", label: "Diversion airports identified", placeholder: "" },
    ],
  },
];

// Reading list from p.1, kept so the section can point at what the answers come out of.
export const FT_REQUIRED_READINGS = [
  "C172 POH",
  "Transport Canada PPL Flight Test Guide (TP 13723E)",
  "Flight Test Notes",
  "Canada Flight Supplement (CFS)",
  "Current VNC/VTA",
  "From the Ground Up",
];

export const FT_REFERENCE_PUBS = [
  "Aeronautical Information Manual (AIM)",
  "Canadian Aviation Regulations (CARs)",
  "Human Factors for Aviation — Basic Handbook (TP 12863)",
  "Aircraft documents",
];
