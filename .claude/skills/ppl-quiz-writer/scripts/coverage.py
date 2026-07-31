#!/usr/bin/env python3
"""
Coverage report for the PPL quiz bank against the TP 12880 syllabus.

Usage:
    python3 coverage.py <path-to-ppl-ground-school-sectional.jsx> [--section "Air Law"] [--limit 30]

Outputs overall coverage %, per-section breakdown, and the specific uncovered
topics to write next. This replaces guessing at gaps from memory — run it at the
START of every batch and write to whatever it reports as uncovered.
"""
import json, re, sys, os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
TOPICS = os.path.join(HERE, "..", "references", "syllabus-topics.json")


def load_corpus(jsx_path):
    """Question text + explanation, lowercased, per question ID.

    Searching text+explanation matters: the key term is often only in the
    explanation. Searching the whole .jsx gives false positives from calculator
    code, comments, and glossary entries — so we extract QUIZ_BANK only.
    """
    content = open(jsx_path).read()
    m = re.search(r"const QUIZ_BANK = \{(.*?)\n\};", content, re.DOTALL)
    if not m:
        sys.exit("Could not find QUIZ_BANK in " + jsx_path)
    entries = re.findall(
        r'\{ id: "([A-Z]+-\d+)", q: "([^"]+)".*?explanation: "([^"]+)"', m.group(0)
    )
    return {qid: (q + " " + expl).lower() for qid, q, expl in entries}


def covered(corpus, terms):
    """A topic counts as covered if any search term appears in any question,
    matched exactly OR as a near-match allowing inserted words.

    Four separate batches hit the same false-negative pattern: a term like
    "cruise chart" failed to match "cruise PERFORMANCE chart" because a
    descriptive word was inserted mid-phrase. Rather than rely on catching
    every such variant by hand in syllabus-topics.json, multi-word terms are
    also checked with up to 2 extra words tolerated between each pair of
    the term's words (in order) — e.g. "cruise chart" matches "cruise
    performance chart" and "four forces" matches "four fundamental forces".
    Single-word terms still require an exact substring match.
    """
    n = 0
    for text in corpus.values():
        for t in terms:
            try:
                if re.search(t, text):
                    n += 1
                    break
            except re.error:
                if t in text:
                    n += 1
                    break
            else:
                words = t.split()
                if len(words) >= 2:
                    fuzzy = r"\W+(?:\w+\W+){0,2}".join(re.escape(w) for w in words)
                    if re.search(fuzzy, text):
                        n += 1
                        break
    return n


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    jsx = sys.argv[1]
    want_section = None
    limit = 40
    if "--section" in sys.argv:
        want_section = sys.argv[sys.argv.index("--section") + 1]
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])

    corpus = load_corpus(jsx)
    topics = json.load(open(TOPICS))

    PRI_ORDER = {"ESSENTIAL": 0, "ESSENTIAL-VERIFY": 1, "P1": 2, "P2": 3, "P3": 4}

    by_section = defaultdict(lambda: {"covered": 0, "total": 0, "gaps": []})
    for t in topics:
        hits = covered(corpus, t["terms"])
        s = by_section[t["section"]]
        s["total"] += 1
        if hits:
            s["covered"] += 1
        else:
            s["gaps"].append((PRI_ORDER.get(t["priority"], 9), t["priority"], t["topic"]))

    total_cov = sum(s["covered"] for s in by_section.values())
    total_all = sum(s["total"] for s in by_section.values())

    ess_gaps = sum(1 for s in by_section.values() for g in s["gaps"] if g[1].startswith("ESSENTIAL"))

    print(f"QUESTIONS IN BANK: {len(corpus)}")
    print(f"TC-ESSENTIAL TOPICS STILL UNCOVERED: {ess_gaps}   <-- write these first")
    print("(Fuzzy matching tolerates inserted words, e.g. 'cruise chart' matches 'cruise")
    print(" performance chart'. This can occasionally over-credit a topic that's only")
    print(" mentioned in passing rather than actually taught — if a section's number looks")
    print(" surprisingly high, do a quick grep of the actual question text before trusting it.)")
    print(f"SYLLABUS COVERAGE: {total_cov}/{total_all} topics ({100*total_cov//total_all}%)")
    print()
    print(f"{'SECTION':44} {'COV':>9}  {'%':>4}")
    print("-" * 62)
    for sec in sorted(by_section, key=lambda x: by_section[x]["covered"] / max(by_section[x]["total"], 1)):
        s = by_section[sec]
        pct = 100 * s["covered"] // s["total"]
        print(f"{sec:44} {s['covered']:4}/{s['total']:<4} {pct:3}%")

    print()
    print("=" * 62)
    print("NEXT TOPICS TO WRITE (TC-ESSENTIAL first, then P1/P2/P3)")
    print("=" * 62)
    shown = 0
    for sec in sorted(by_section, key=lambda x: by_section[x]["covered"] / max(by_section[x]["total"], 1)):
        if want_section and sec != want_section:
            continue
        gaps = sorted(by_section[sec]["gaps"])
        if not gaps:
            continue
        print(f"\n## {sec}  ({len(gaps)} uncovered)")
        for _, pri, topic in gaps:
            if shown >= limit:
                print(f"   ... and {sum(len(by_section[s]['gaps']) for s in by_section) - shown} more (raise --limit)")
                return
            print(f"   [{pri}] {topic}")
            shown += 1


if __name__ == "__main__":
    main()
