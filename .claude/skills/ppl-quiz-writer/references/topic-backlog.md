# PPL Quiz Bank — Topic Backlog

**Derived from:** Transport Canada, *Study and Reference Guide for Written Examinations for the Private Pilot Licence Aeroplane* (TP 12880), Sixth Edition, May 2025. Cross-referenced against the live `QUIZ_BANK` (337 questions at time of writing).

**v2 update:** the guide marks certain subjects as "essential knowledge" with a bullet (✈ symbol on the web page). That marker didn't survive a first HTML fetch, so v1 of this backlog used my own subjective P1/P2/P3 judgment instead. It turns out the marker **does** survive PDF text extraction — not as a visible symbol, but as a **leading space** on every essential line that non-essential lines don't have (e.g. in the raw extracted text, `" 401.05 Recency Requirements"` has essential status, `"401.03 Requirement to Hold..."` doesn't). This file now uses that real signal instead of guesswork. Source: `https://tc.canada.ca/sites/default/files/2025-07/TP_12880_E.pdf`, fetched with text extraction — every classification below was read directly off that marker, not inferred.

**Caveat worth stating plainly:** this was extracted by one careful manual pass over the fetched text, not a script, since the marker is a single whitespace character and easy to mistype by hand. Spot-check anything decision-critical against the source PDF/webpage directly — the link above, or `#toc3` through `#toc6` on the HTML page for Air Law/Navigation/Meteorology/Aeronautics respectively.

---

## What changed from v1

The essential/non-essential split **cuts across** what was already covered — most already-covered content turns out to be essential (good sign, general aviation instinct pointed the right way), but several genuine essential gaps exist that v1's P1/P2/P3 tiers didn't specially flag. **This file's Tier 1 is the new highest-priority list — it supersedes v1's P1 tier.**

Also confirmed by this pass: TC's own "Other Hazards" list (hurricane, tornado, forest fires, dust devils, eclipse) is **not** essential — matches v1's independent P3 judgment call to leave those low-priority.

---

## Tier 1 — Essential knowledge, currently zero coverage (write these first)

### Air Law
- **602.10** Starting and ground running of aircraft engines
- **602.21** Avoidance of collision (general obligation, distinct from right-of-way ordering)
- **602.62 / 602.63** Life preservers, flotation devices, life rafts — over-water requirements
- **605.25** General use of safety belts and restraint systems
- **605.84** Aircraft maintenance — general
- Radar service — clock position system ("traffic at 2 o'clock")
- Common Frequency Areas (CFA)
- Operations on intersecting runways, including LAHSO
- Procedures for the prevention of runway incursion

### Navigation
- Locating position by latitude and longitude
- Diversion to an alternate destination
- Return to departure point (reciprocal track)
- Electronic Flight Bag — basic principles/use/limitations, power sources and backup, distraction management
- Primary and Secondary Surveillance Radar (PSR/SSR) — the actual distinction
- AIP Supplement (under Maps and Charts — distinct from the AIP Supplement mention under Pre-Flight Prep, both essential)

### Meteorology
- Veer and back (wind direction change terminology)
- Pressure gradient — relationship to wind speed
- Gust fronts and downbursts (as thunderstorm hazards, distinct from the already-covered microburst)
- Hail and lightning (as thunderstorm hazards)
- AWOS / LWIS / AUTO — automated observation types and limitations
- Flight Service Stations (FSS) and Flight Information Centres (FIC)
- Collaborative Flight Planning Services (CFPS)
- Upper Winds and Temperature Forecast (FB) — decoding format (the true-north reference is already covered; the decode format itself isn't)

### Aeronautics — Airframes, Engines, Systems
- Oil viscosity, grades, and seasonal use
- Vapour lock
- Fuel contamination and deterioration

### Aeronautics — Theory of Flight
- Longitudinal, lateral, and directional stability (named individually — general "stability" concept exists but not these three specifically)

### Aeronautics — Flight Instruments
- Magnetic dip (partially adjacent to compass errors, but not covered as its own concept)

### Aeronautics — Flight Operations
- Runway numbering — relationship to magnetic heading
- Displaced threshold
- VASIS / VASI / AVASI / PAPI / APAPI — reading the approach slope indication
- Wheelbarrowing
- Porpoising
- Hydroplaning
- Sideslips
- Ground effect
- Vx (best angle of climb) and Vy (best rate of climb) — the rest of the V-speed family is covered; these two specifically are not
- Vref (reference landing speed)
- Zero fuel calculation and maximum zero fuel weight
- Wake turbulence — causes, effects, avoidance (the ATC-procedures mention of wake turbulence separation is NOT essential, but this Flight Operations subsection specifically is)
- Cold-soaking phenomenon
- Canadian Runway Friction Index (CRFI) — verify how it's read/applied before writing

### Human Factors
- Effects of smoking and vaping
- Threat and error management (TEM)
- Risk management (as a distinct framework from decision-making models already covered)
- Interaction with automation, EFBs, GNSS/GPS moving maps
- Maps and charts — errors in interpretation and use

---

## Tier 2 — Essential, but verify a specific number/definition first

- **602.14** Minimum Altitude and Distances — already covered generally; confirm the specific numeric scenarios don't have an untested edge case
- **Attitude Indicator principles + errors** (essential) and **Heading Indicator principles + errors** (essential) — the *reading* skill lives in the Instrument Reading calculator; the *principles of operation and error* angle (distinct from just reading pitch/bank) doesn't have a quiz question yet
- **Take-off charts, crosswind charts, cruise charts, landing charts** (all essential under "Use of Performance Charts") — the Performance Chart concept is now covered generically; confirm cruise-chart and crosswind-chart-as-a-chart-type (distinct from the Crosswind Component calculator's arithmetic) don't need their own question
- **CG limits, locating CG** (essential) — covered via the calculator and CG envelope concept questions; confirm "locating CG" as a defined *procedure* (using a loading graph or computation) has explicit quiz coverage, not just the envelope concept
- **Load adjustment** (essential) — shipped as CG Shift on Load Change calculator; confirm a conceptual MCQ version exists, not just the calculator
- **Normal and utility category** (essential) — already have an aircraft-category-certification question; confirm it specifically addresses the Normal vs. Utility W&B-relevant distinction, not just certification broadly
- **Hypoxia and hyperventilation** (essential) — both already well covered individually; low risk, just confirm no gap
- **Orientation and disorientation, including visual and vestibular illusions** (essential) — extensively covered; low risk

---

## Tier 3 — Not marked essential, still genuinely uncovered

Lower priority than Tiers 1–2, but still real syllabus content with no risk premium beyond the usual verification step. Pull from here once Tier 1 is exhausted.

**Air Law**: 602.06 Smoking, 602.08 Portable electronic devices, 602.09 Fuelling with engines running, 602.23 Dropping of objects, 602.25 Entering/leaving aircraft in flight, 602.86 Carry-on baggage, 602.89 Passenger briefings, 605.29 Flight control locks, 606.02 Liability insurance, 602.15 Permissible low altitude flight, 602.32 Airspeed limitations (verify the actual speed/altitude figure), 602.61 Survival equipment, 602.133 Language in radiocomms, 602.136 Continuous listening watch, 605.85/86/88 Maintenance release/schedule/inspection, VFR holding procedures, 601.15/16 Forest fire restrictions, 601.19/20 Lasers/bright light, 602.144 Interception signals (verify carefully if attempted)

**Navigation**: Agonic line, air position vs. ground position, low level navigation, position lines to obtain a fix, visual angle of departure, double track error method, 10° drift lines, Canada Flight Supplement use, LF/HF/VHF radio theory, ADS-B, TCAS

**Meteorology**: atmosphere composition, vertical structure, isobars, station vs. sea level pressure, sublimation, subsidence/convergence, haze and smoke, blowing obstructions to vision, diurnal effects, Coriolis, hoar frost, impact icing (engine), surface weather maps/prognostic charts, trowal (verify — distinctly Canadian term), AWIS/AWBS (as distinct from the essential FSS/FIC/CFPS)

**Aeronautics**: four-stroke cycle, engine cooling methods, ammeter vs. load meter, bus bars, circuit breakers/fuses, grounding/bonding, oil cooler/filters/venting, primers, MOGAS, Bernoulli's theorem, Newton's laws, centre of pressure, centrifugal/centripetal, wingtip vortices, aspect ratio, laminar flow, dihedral/anhedral, wing fences/stall strips, spoilers, canards, control balancing, VSI, gyroscopic precession, EFIS, unusual attitude recovery, airport rotating beacon, obstruction marking, short/soft field technique, Vlo, gliding for range vs. endurance, spirals (distinct from spins, which is essential), W&B terms (datum/arm/moment), standard weights, maximum landing weight, de-icing fluid Types I–IV (verify)

**Human Factors**: gas expansion effects, hearing mechanism, diet/nutrition/fasting, heat and cold, vibration, peer pressure/family relationships, decompression/SCUBA (verify current intervals), anaesthetics (verify grounding periods), blood donation (verify interval), pregnancy

---

## Deliberately excluded (unchanged from v1)

- **NOTAM classifications** — repeatedly judged too risky to state precisely without a stronger source
- **Specific GFA symbol pictographs** — kept text-code-based for accuracy/copyright reasons
- **Hydraulic lock** — radial-engine-specific, not relevant to typical PPL trainers
- **Drug/alcohol testing program specifics** — policy-heavy, low confidence on current Canadian details
- **PTSD / mental health self-disclosure** — sensitive and policy-specific
- **TC's own "Other Hazards"** (hurricane, tornado, forest fires, dust devils, eclipse) — confirmed NOT essential by the real marker; low priority

---

## How to re-run this analysis

**Coverage check** (unchanged from v1):
```bash
python3 << 'EOF'
import re, json
content = open('ppl-ground-school-sectional.jsx').read()
m = re.search(r'const QUIZ_BANK = \{(.*?)\n\};', content, re.DOTALL)
entries = re.findall(r'\{ id: "([A-Z]+-\d+)", q: "([^"]+)".*?explanation: "([^"]+)"', m.group(0))
corpus = {qid: (q + " " + expl).lower() for qid, q, expl in entries}
json.dump(corpus, open('/tmp/corpus.json','w'))
EOF
python3 -c "
import json
c = json.load(open('/tmp/corpus.json'))
def hits(*terms): return sum(1 for t in c.values() if any(x in t for x in terms))
print(hits('your term', 'synonym'))
"
```

**Essential-marker check** (new): fetch `https://tc.canada.ca/sites/default/files/2025-07/TP_12880_E.pdf` with `web_fetch_pdf_extract_text: true`. Look for a leading single space before a topic line — that's the essential marker. Read it by eye, don't try to script-parse it automatically; the signal is a single whitespace character and easy to corrupt with any automated text processing (line-trimming, whitespace normalization, etc. would all destroy it). If the guide gets a new edition, re-verify the marker still survives extraction the same way before trusting it again.

---

## Caveats (carried over / updated from v1)

- **This is a manual read of a whitespace artifact**, not an official structured export. Real, but fragile — verify against the source directly for anything decision-critical.
- **The keyword search can produce false negatives.** Before writing on a Tier 1 topic, do a quick targeted check of the actual question text rather than trusting a zero purely on faith.
- **Syllabus items aren't equal in exam weight even within a tier.** TC's own guide says the topic list "is not meant to be a detailed and exhaustive list."
