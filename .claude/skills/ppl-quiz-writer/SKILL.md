---
name: ppl-quiz-writer
description: Use this whenever the user asks to add, write, or generate more quiz questions for "License to Learn" (the Canadian PPL/PPAER written exam prep app), or mentions adding questions to Air Law, Navigation, Meteorology, Aircraft & Systems, or Human Factors categories in that app. Also use when asked to review, improve, or rewrite distractors, to check quiz coverage or gaps, or to ask what topics still need questions. This skill contains a coverage script that maps the bank against Transport Canada's official PPAER syllabus (TP 12880) and tells you exactly which topics are still uncovered — run it before writing anything. It also encodes the exact code format, verified-fact log, and distractor-quality patterns. Always use this skill rather than hand-writing questions from memory, even when the task looks like simple content writing — picking topics from memory is the documented failure mode this skill exists to prevent.
---

# PPL Quiz Writer

Writes new multiple-choice questions for the "License to Learn" PPL/PPAER exam prep app, in the app's exact existing format and quality bar. This skill lives directly in the app's git repo, at `.claude/skills/ppl-quiz-writer/` — the question bank itself lives at `src/data/questions.js`, a `QUIZ_BANK` constant holding 5 category arrays, separate from the calculator/UI code in `src/components/`.

## Quick start (do this first, every time)

```bash
python3 .claude/skills/ppl-quiz-writer/scripts/coverage.py src/data/questions.js --limit 40
```

**Check the coverage % first.** As of this writing the bank sits at 412/412 topics (100%) across all 8 sections — this was reached deliberately, not by accident, and the script will confirm it's still true or tell you it's slipped (if the syllabus map itself has been extended since).

**If the script reports gaps**: write questions for the topics it lists as uncovered, TC-ESSENTIAL first, weakest section first. Re-run it at the end and confirm coverage went up. The goal is syllabus coverage, not question count — a batch that adds 30 questions but closes 3 topics is worse than one that adds 20 and closes 20.

**If the script reports 100% (the normal case now)**: don't force new "gap" topics into existence. Two legitimate paths for a batch instead:
1. **Scenario variants** (see below) — apply an already-verified rule to new concrete numbers/situations. This is the sustainable way to keep growing the bank once genuine topic coverage is complete; it's not padding, it's closer to how the real exam actually tests a rule multiple ways.
2. **Re-derive the syllabus map** if TP 12880 has a newer edition, or check TP 12880's referenced materials list for another blind spot like the VFR Phraseology one — 100% against the current map isn't the same as "no more real content exists to test."

Don't chase 100% by writing weak, forced, or barely-relevant questions once the genuine gaps are gone — that would trade the thing this whole system was built to protect (quality, verified content) for a vanity number.

**Default batch size: 20–30 questions** unless the user says otherwise.

## Before writing anything: verify first

**Never invent a regulatory number, frequency, or specific fact from memory alone if it's the kind of thing that could be subtly wrong.** This app's credibility rests on every fact being checkable. Before writing a question:

1. Check `references/verified-facts.md` in this skill — many CARs sections, frequencies, and conventions are already confirmed there. If the fact you need is already logged, use it directly, no new search needed.
2. If the fact isn't logged yet, web-search to verify it (prefer official sources: Transport Canada CARs text, TC AIM, NAV CANADA). Add the new fact to `references/verified-facts.md` afterward so future sessions don't re-search it.
3. Never copy question text from a real practice exam or commercial question bank — write original questions grounded in verified facts, not reproduced questions.

## Question format (exact)

Each question is one object in a category's array:

```js
{ id: "AL-053", q: "Question text ending in a question mark?", options: ["Option A", "Option B", "Option C", "Option D"], correct: 1, explanation: "One sentence explaining why the correct answer is correct, citing the CAR section or concept where relevant." },
```

- **`id` is required on every question** — a stable identifier the rest of the app depends on (paused-quiz resume, and any future per-question analytics). Format is `PREFIX-NNN`, zero-padded to 3 digits: `AL` (Air Law), `NAV` (Navigation), `MET` (Meteorology), `AS` (Aircraft & Systems), `HF` (Human Factors). Before writing new questions, find the highest existing number in that category and continue from there — never reuse a number, even for a retired/rewritten question:
  ```bash
  grep -o '"AL-[0-9]*"' src/data/questions.js | sort -t- -k2 -n | tail -1
  ```
- `correct` is the **zero-indexed** position of the right answer in `options`.
- `explanation` is always present, one sentence, plain language, cites the source (e.g. "CAR 602.14(2)(b)...") when it's a regulatory fact.
- Keep question and option wording style consistent with existing questions in the same category — skim a few neighbors before writing new ones.

## The 5 categories and where they map

`src/data/syllabus.js`'s `CATEGORY_TO_SECTION` and `OFFICIAL_SECTIONS` constants define this — don't change it, just know it when picking a category:

| QUIZ_BANK category | Official PPAER section |
|---|---|
| `"Air Law"` | Air Law |
| `Navigation` | Navigation |
| `Meteorology` | Meteorology |
| `"Aircraft & Systems"` | Aeronautics — General Knowledge |
| `"Human Factors"` | Aeronautics — General Knowledge |

## Composing a batch for maximum coverage gain

With ~20–30 questions per batch, how you allocate them determines whether coverage moves meaningfully or barely at all.

**The rule: one question per uncovered topic, until the essentials are gone.** Don't write four questions on ground effect while hydroplaning, porpoising, and sideslips sit at zero. Breadth first — a student who's seen one solid question on each of 25 topics is better prepared than one who's seen five on each of five topics.

**Suggested allocation for a 25-question batch at current coverage:**
- ~15 questions → the weakest section's TC-ESSENTIAL gaps (one each)
- ~7 questions → second-weakest section's ESSENTIAL gaps (one each)
- ~3 questions → P1 gaps anywhere, or scenario variants of rules verified this batch

**Switch to depth only when a section clears its essentials.** Once `coverage.py` shows no ESSENTIAL gaps left in a section, that section is ready for the scenario-variant treatment below — multiple angles on the same verified rule. Until then, breadth wins.

**Batching by section beats batching by question count.** "Close every ESSENTIAL gap in Flight Operations" is a better batch definition than "write 25 questions," because it produces a measurable, reportable outcome: a section going from 28% → 50%+.

## Scenario variants: a second axis, not a fallback

**Note:** an earlier version of this skill framed this technique as what to do "when topics run out." That framing was wrong — a later syllabus-based analysis (see `references/topic-backlog.md`) found ~125 uncovered topics in a 337-question bank. Topics were never actually running out; the gap-finding method was just weak. Use this technique because testing a rule through several concrete situations is genuinely how real exams work, not because new topics are unavailable. Commercial banks with hundreds of questions aren't covering hundreds of distinct facts; they're testing the same verified rules through many different concrete situations. This app already does exactly that for the calculators (generated wind-triangle/W&B/METAR problems) — it just hadn't been applied to the quiz bank.

**The technique**: pick a rule already verified in `verified-facts.md` that has a numeric or situational "apply this to figure out X" shape — the hemispheric cruising altitude rule, right-of-way geometry, passenger currency math, fuel reserve arithmetic, minimum height over obstacles — and write several questions applying the *same* rule to *different* concrete numbers or scenarios. Each variant is a legitimately different test of application, not a duplicate.

Good candidates for this pattern (rules with a clean numeric or if-then structure):
- Hemispheric rule (track + altitude → legal/illegal)
- Right-of-way (specific converging/overtaking/head-on scenario → who gives way)
- Passenger currency (specific T/L counts + dates → current or not)
- Fuel reserve (specific flight time + fuel on board → legal or not)
- Minimum height over obstacles (specific obstacle height → minimum legal altitude)

**Guardrails**: always verify the underlying rule is already confirmed in `verified-facts.md` before generating variants (don't verify a new rule *and* generate variants of it in the same pass — that's still new-concept work, just disguised). Work out the numeric answer in a scratch calculation (Python is fine) before writing the question, so the `correct` index is actually right — this is exactly the kind of place an off-by-one arithmetic slip would silently produce a wrong "correct" answer. Vary the surface details (different track/altitude/aircraft labels) enough that the questions don't read as copy-pasted with numbers swapped.

## Check TP 12880's referenced materials for topic-map blind spots

`syllabus-topics.json` was built from TP 12880's main bulleted topic list — but the guide also references other official documents as required study material (e.g. NAV CANADA's VFR Phraseology guide) without necessarily giving them their own bullet in the topic list. A gap like this is invisible to `coverage.py` in a different way than a normal uncovered topic: the script can't flag what was never entered as a topic at all.

VFR phraseology was found this way — TP 12880 explicitly points to `navcanada.ca/en/vfr-phraseology.pdf` as required material, but "phraseology" isn't a bulleted item, so it was absent from the original 409-topic extraction entirely. If something feels like it should obviously be tested (a whole reference document exists for it) but isn't in `syllabus-topics.json` at all, check TP 12880's reference-materials list rather than assuming it's just a low-priority gap the script already accounted for. Add the missing topic(s) with generous terms *before* writing any questions, so the coverage number reflects the new content correctly and future sessions benefit from the same detection.

## Check new calculators for quiz-bank gaps

Every time a new calculator ships (see the app's own calculator list), it adds a concept to the app that the quiz bank may not yet reinforce at all — calculators and quiz questions are built somewhat independently, so this isn't automatic. Crosswind Component, TAS from CAS, CG Shift on Load Change, and Instrument Reading all shipped with zero corresponding quiz-bank coverage of their core concepts until a later session caught it.

**How to check properly**: `src/data/questions.js` contains only question data (no calculator code mixed in, unlike the old single-file artifact), so grepping it directly is safe:
```bash
grep -io "your search term" src/data/questions.js
```
A calculator's actual generator/UI code lives in `src/lib/calculators.js` and `src/components/Calculators.jsx` — check there separately if you want to confirm the calculator itself exists, but don't search those files when checking quiz-bank coverage, or you'll get false positives from code comments and UI copy.
Treat any calculator whose concept has zero real hits this way as a priority source of new questions — it's a more reliable gap-finding signal than the general "what haven't we covered" gap lists, since it's checking something concrete rather than relying on memory of past batches.

## Distractor quality bar (this is the important part)

Weak distractors are easy to eliminate on sight (irrelevant, silly, or wildly-off-scale). Good distractors require actually knowing the material. Use these patterns, learned from Transport Canada's own sample exam (TP 13014) style — not copying its questions, copying its *technique*:

1. **Close numeric siblings.** If the answer is 60 minutes, distractors should include 30 min and 2 hr — not 30 min and 24 hr. Real adjacent regulatory values (e.g. day vs. night reserve minutes) make the best siblings.
2. **Definition conflation.** Use the *correct* definition of a different-but-related term as a distractor. E.g. for "what is Va," a distractor can be Vno's real definition, not a made-up wrong one.
3. **Direction/scope flip.** Same concept, wrong direction ("incipient right spin" vs. left) or a falsely added qualifier ("increases in level flight *only*" when it's actually universal, or a false precondition like "only if ATC instructs").
4. **Mixed distractor types** within one question — not four numbers, not four vague phrases. Combine a numeric sibling, a definition-conflation, and a scope-flip in the same question when it fits naturally.
5. **Avoid:** joke options, options unrelated to the question's domain (e.g. "fuel color" as a distractor for a communications question), and any distractor that isn't factually distinguishable from the correct answer (don't create accidental ambiguity).

After drafting, sanity-check: could someone eliminate 2 of the 3 wrong answers just by them "sounding wrong," without knowing the actual regulation/concept? If yes, rewrite those.

## Workflow

**The goal of every batch is to raise syllabus coverage.** Not "add some questions" — close specific uncovered topics from TP 12880. Steps 1–3 are non-negotiable; skipping them is how earlier sessions wrongly concluded topics were "running out."

1. **Run the coverage report first. Always.**
   ```bash
   python3 .claude/skills/ppl-quiz-writer/scripts/coverage.py src/data/questions.js --limit 40
   ```
   This prints current coverage %, the weakest sections, and the exact uncovered topics. **Do not pick topics from memory or by grepping around — the script is the source of truth.**

2. **Take topics from the report, weakest section first.** The script already sorts sections by coverage and lists P1 (safe to write now) before P2 (verify specifics first). Work top-down. Targeting the weakest section is what actually moves overall coverage, and matches how the real exam sections are weighted equally.

3. **Confirm the gap is real before writing.** The keyword match can produce false negatives — a topic may be covered under wording the search terms missed. Quick check:
   ```bash
   grep -io "your term" src/data/questions.js
   ```
   If it turns out covered, **add the missing search term to `references/syllabus-topics.json`** so the report is right next time, and move to the next topic.

4. Verify facts per the "Before writing anything" section above — especially for anything tagged P2.
5. Find the next available `id` number per category (see Question Format above) before writing, so IDs assigned mid-batch don't collide with each other.
6. Write each question following the format and distractor bar above.
7. Insert questions at the true end of the target category's array in `src/data/questions.js` — **grep for the category's opening line and the *next* category's opening line to find the real last question**, since earlier questions in the array are not safe insertion anchors (multiple near-identical-looking lines may exist from prior edits). Use an exact string match on the last question's full line as anchor.
8. After editing, validate structurally by actually executing the bank as JS — this catches real bugs (bad `correct` index, missing `explanation`, duplicate option text, duplicate/missing IDs) that a brace-count can't:
   ```bash
   python3 - << 'PYEOF'
   src = open("src/data/questions.js").read()
   start = src.index("const QUIZ_BANK = {")
   end = src.index("\n};", start) + 3
   open("/tmp/bank.mjs", "w").write(src[start:end] + "\nexport default QUIZ_BANK;\n")
   PYEOF
   node --input-type=module -e "
   import bank from '/tmp/bank.mjs';
   let n=0, problems=[]; const ids=new Set();
   for (const [cat, arr] of Object.entries(bank)) {
     arr.forEach((q)=>{
       n++;
       if (!q.id) problems.push('missing id in '+cat);
       if (ids.has(q.id)) problems.push('duplicate id '+q.id);
       ids.add(q.id);
       if (!Array.isArray(q.options) || q.options.length!==4) problems.push(q.id+' bad option count');
       if (!Number.isInteger(q.correct) || q.correct<0 || q.correct>=4) problems.push(q.id+' bad correct index');
       if (!q.explanation) problems.push(q.id+' missing explanation');
       if (new Set(q.options).size !== q.options.length) problems.push(q.id+' duplicate option text');
     });
     console.log(cat.padEnd(22), arr.length);
   }
   console.log('total', n, '| unique ids', ids.size);
   console.log(problems.length ? problems.join('\n') : 'No structural problems found.');
   "
   ```
   `total` must equal `unique ids`, and the problems list must be empty. Also do a quick brace/paren balance check on the whole file (not just the bank) as a final sanity pass:
   ```bash
   python3 -c "
   s = open('src/data/questions.js').read()
   print('braces:', s.count('{'), s.count('}'))
   print('parens:', s.count('('), s.count(')'))
   "
   ```
9. **Check for near-duplicates** — structural validation catches duplicate IDs, not two questions asking the same thing in different words. Real risk past a few hundred questions:
   ```bash
   python3 .claude/skills/ppl-quiz-writer/scripts/dupecheck.py src/data/questions.js --threshold 0.7
   ```
   Numeric scenario variants are auto-filtered, so anything reported is worth a look. Reword or drop genuine restatements.
10. **Re-run the coverage report** to confirm the batch actually closed the topics you targeted:
   ```bash
   python3 .claude/skills/ppl-quiz-writer/scripts/coverage.py src/data/questions.js --limit 5
   ```
   If a topic you wrote for still shows uncovered, your question's wording doesn't contain the search terms — either reword it or add the term to `syllabus-topics.json`. **Coverage % going up is the actual success metric for the batch.**
11. Add any newly verified facts to `references/verified-facts.md`.
12. **Commit the changes** — both the question additions in `src/data/questions.js` and any updates to this skill's own files (`syllabus-topics.json`, `verified-facts.md`, etc.) are just regular files in the repo now. A commit message like `quiz: close N Flight Operations gaps (coverage 84% -> 97%)` gives useful history for free. No separate packaging or re-upload step exists anymore — committing *is* how future sessions (and other contributors) get the update.
13. Report back: **coverage before → after** (the headline number), how many questions added per section, and which specific syllabus topics are now closed.

## Improving existing distractors (separate from adding questions)

When asked to review or rewrite distractor quality rather than add new content:

1. Triage category by category rather than rewriting everything at once — skim each question's options and flag ones that are irrelevant-to-the-domain, joke options, or wildly-off-scale numbers (these are the ones worth fixing; already-good distractors don't need touching).
2. Air Law has historically had the weakest distractors of the 5 categories on first pass — check it first if triaging blind.
3. Rewrite using the patterns above. When reordering options, **the `correct` index must be updated to match** — this is the easy mistake to make. After every edit, re-verify: does `options[correct]` still read as the actual right answer?
4. Run the same structural validation as step 8 above afterward — reordering options is exactly the kind of edit that silently breaks a `correct` index if done carelessly.

## This skill lives in the repo now — no packaging, no re-extraction

This used to be a claude.ai-uploaded `.skill` zip that had to be re-extracted every session because the sandbox it ran in didn't persist between conversations, and re-packaged and re-uploaded every time it changed. Neither problem exists anymore: this skill is a plain directory at `.claude/skills/ppl-quiz-writer/` checked into the app's git repo (per Anthropic's Agent Skills spec, which Claude Code reads directly — no packaging step, no proprietary format).

**What that changes in practice:**
- Edit `SKILL.md` or anything in `references/`/`scripts/` exactly like any other file in the repo, then `git commit`. That commit *is* the update — there's no separate "repackage and present" step anymore.
- Nothing needs re-extracting at the start of a session. The files are just... there, the same way `src/App.jsx` is just there.
- If a reference file (`syllabus-topics.json`, `verified-facts.md`) is ever missing or looks wrong, that's a real git state problem (wrong branch, uncommitted local changes, merge conflict) — check `git status` and `git log` on this directory, not a sandbox-persistence issue.
- `coverage.py` still reads the live `src/data/questions.js` directly rather than trusting any cached/remembered number, which is the same self-correcting property as before — that didn't need to change, and it's still the reason gap-finding lives in a script rather than prose.

## Reference files

- **`scripts/coverage.py` + `references/syllabus-topics.json` — THE source of truth for what to write next.** 412 topics from TP 12880 (6th ed, May 2025) with detection terms. Run at the start and end of every batch.
- **`references/topic-backlog.md`** — narrative context on the gap analysis. v2 uses TC's own "essential knowledge" marker (a leading-space artifact that survives PDF text extraction), so Tier 1 is real TC-marked essential content, not a guess. Useful for the reasoning behind priorities; `syllabus-topics.json` is what to actually query.
- `references/verified-facts.md` — every CAR section, frequency, format convention, and specific number already confirmed by web search in past sessions. Check this first before searching again.
- `scripts/dupecheck.py` — near-duplicate detection. Run after every batch.

**Deliberately removed:** a `covered-topics.md` prose file used to live here. It went stale repeatedly and at one point wrongly asserted topics were "running out," which sent several sessions down the wrong path. The coverage script replaced it. A stale prose list is worse than none, because it invites trusting it — don't recreate it.

**Recurring failure mode when adding new terms to `syllabus-topics.json`: bare substring matching misses natural phrasing.** Three separate batches hit this — "four forces" missed "four **fundamental** forces," "cruise chart" missed "cruise **performance** chart," "carburettor heat" (British) missed "carburetor heat" (American, what the file actually uses). When adding a term for a topic, don't just use the shortest natural phrasing — also add the version with a descriptive word inserted (e.g. both "X chart" and "X performance chart"), and check both American and British spellings for words that have them (carburetor/carburettor, color/colour, aluminum/aluminium). This is now a pattern, not a one-off.
