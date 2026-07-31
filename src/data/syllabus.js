// The 4-leg study syllabus, and the mapping from quiz categories to the 4 official PPAER sections.

export const SYLLABUS = [
  {
    leg: 1,
    title: "Air Law & Regulations",
    topics: [
      { id: "w1t1", title: "CARs Part VI — General Operating Rules", hours: 3, quizCategory: "Air Law", reading: { fgu: "Air Rules & Procedures", tcaim: "RAC — Rules of the Air and Air Traffic Services", other: "CARs Part VI" } },
      { id: "w1t2", title: "Canadian airspace classification", hours: 2, quizCategory: "Air Law", reading: { fgu: "Aerodromes & Airspace", tcaim: "RAC — Rules of the Air and Air Traffic Services", other: "Designated Airspace Handbook" } },
      { id: "w1t3", title: "VFR weather minima", hours: 2, quizCategory: "Air Law", reading: { fgu: "Air Rules & Procedures", tcaim: "RAC — Rules of the Air and Air Traffic Services", other: "CARs 602.114–602.117" } },
      { id: "w1t4", title: "Right-of-way rules & emergency procedures", hours: 2, quizCategory: "Air Law", reading: { fgu: "Air Rules & Procedures", tcaim: "RAC — Rules of the Air and Air Traffic Services", other: "CARs 602.19" } },
      { id: "w1t5", title: "Licensing, medical & currency requirements", hours: 1.5, quizCategory: "Air Law", reading: { fgu: "Airmanship", tcaim: "LRA — Licensing, Registration and Airworthiness", other: "CARs Part IV" } },
      { id: "w1t6", title: "Required aircraft documents & emergency codes", hours: 1.5, quizCategory: "Air Law", reading: { fgu: "Air Rules & Procedures / Airmanship", tcaim: "LRA — Licensing, Registration and Airworthiness", other: "CARs 202.26, 401.03, 605.03, 605.95" } },
    ],
  },
  {
    leg: 2,
    title: "Navigation & Flight Planning",
    topics: [
      { id: "w2t1", title: "Charts, symbols & sectional interpretation", hours: 3, quizCategory: "Navigation", reading: { fgu: "Air Navigation Theory", tcaim: "MAP — Aeronautical Charts and Publications" } },
      { id: "w2t2", title: "Dead reckoning & the wind triangle", hours: 3, quizCategory: "Navigation", reading: { fgu: "Air Navigation Theory" } },
      { id: "w2t3", title: "Flight planning & fuel calculations", hours: 2, quizCategory: "Navigation", reading: { fgu: "Air Navigation Theory", other: "CARs 602.88 (fuel requirements)" } },
      { id: "w2t4", title: "Time zones, TSOs & NOTAMs", hours: 1.5, quizCategory: "Navigation", reading: { fgu: "Air Navigation Theory", tcaim: "GEN — General" } },
      { id: "w2t5", title: "Radio navigation basics (VOR/GPS)", hours: 2, quizCategory: "Navigation", reading: { fgu: "Radio Navigation", tcaim: "COM — Communications, Navigation and Surveillance" } },
      { id: "w2t6", title: "Magnetic compass errors", hours: 1, quizCategory: "Navigation", reading: { fgu: "Air Navigation Theory" } },
      { id: "w2t7", title: "Altimetry & pressure altitude", hours: 1.5, quizCategory: "Navigation", reading: { fgu: "Air Navigation Theory / The Aeroplane", tcaim: "RAC — Rules of the Air and Air Traffic Services", other: "CAR 602.36 (altimeter setting procedures)" } },
    ],
  },
  {
    leg: 3,
    title: "Meteorology",
    topics: [
      { id: "w3t1", title: "Atmosphere, pressure & temperature", hours: 2, quizCategory: "Meteorology", reading: { fgu: "Aviation Weather", tcaim: "MET — Meteorology" } },
      { id: "w3t2", title: "Clouds, precipitation & icing", hours: 2, quizCategory: "Meteorology", reading: { fgu: "Aviation Weather", tcaim: "MET — Meteorology" } },
      { id: "w3t3", title: "Fronts, air masses & turbulence", hours: 2, quizCategory: "Meteorology", reading: { fgu: "Aviation Weather", tcaim: "MET — Meteorology" } },
      { id: "w3t4", title: "Weather reports & forecasts (METAR/TAF/GFA)", hours: 2.5, quizCategory: "Meteorology", reading: { fgu: "Aviation Weather", tcaim: "MET — Meteorology" } },
      { id: "w3t5", title: "Density altitude & performance effects", hours: 1.5, quizCategory: "Meteorology", reading: { fgu: "Aviation Weather" } },
      { id: "w3t6", title: "Mountain flying & turbulence", hours: 1.5, quizCategory: "Meteorology", reading: { fgu: "Aviation Weather", tcaim: "MET — Meteorology" } },
    ],
  },
  {
    leg: 4,
    title: "Aircraft, Systems & Human Factors",
    topics: [
      { id: "w4t1", title: "Airframe, engine & propeller systems", hours: 2, quizCategory: "Aircraft & Systems", reading: { fgu: "The Aeroplane / Aero Engines" } },
      { id: "w4t0", title: "Theory of flight fundamentals", hours: 2, quizCategory: "Aircraft & Systems", reading: { fgu: "Theory of Flight" } },
      { id: "w4t2", title: "Flight instruments (pitot-static & gyroscopic)", hours: 2, quizCategory: "Aircraft & Systems", reading: { fgu: "The Aeroplane" } },
      { id: "w4t3", title: "Weight & balance calculations", hours: 2, quizCategory: "Aircraft & Systems", reading: { fgu: "The Aeroplane" } },
      { id: "w4t4", title: "Human factors & aeromedical", hours: 2, quizCategory: "Human Factors", reading: { fgu: "Human Factors", tcaim: "AIR — Airmanship" } },
      { id: "w4t5", title: "PSTAR/HALO review & practice exam", hours: 3, quizCategory: null, reading: { other: "Transport Canada PSTAR Study Guide" } },
    ],
  },
];

export const CATEGORY_TO_SECTION = {
  "Air Law": "Air Law",
  Navigation: "Navigation",
  Meteorology: "Meteorology",
  "Aircraft & Systems": "Aeronautics — General Knowledge",
  "Human Factors": "Aeronautics — General Knowledge",
};

export const OFFICIAL_SECTIONS = ["Air Law", "Navigation", "Meteorology", "Aeronautics — General Knowledge"];

export const PASS_MARK = 60;
