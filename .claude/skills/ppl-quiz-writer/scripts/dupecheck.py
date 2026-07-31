#!/usr/bin/env python3
"""
Near-duplicate detection for the PPL quiz bank.

Usage:  python3 dupecheck.py <path-to-.jsx> [--threshold 0.6]

Structural validation catches duplicate IDs and duplicate option text within a
question. It does NOT catch two questions that ask the same thing in different
words — which becomes a real risk as the bank grows past a few hundred and no
single person can hold it all in mind. Run this after every batch.
"""
import re, sys
from itertools import combinations

STOP = set("what is the a an of to in for and or which does do how why when "
           "must may can should would generally typically about that this it "
           "on at as be are was were with from by if not no".split())


def tokens(q):
    return {w for w in re.findall(r"[a-z]{3,}", q.lower()) if w not in STOP}


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    thresh = 0.6
    if "--threshold" in sys.argv:
        thresh = float(sys.argv[sys.argv.index("--threshold") + 1])

    content = open(sys.argv[1]).read()
    bank = re.search(r"const QUIZ_BANK = \{(.*?)\n\};", content, re.DOTALL).group(0)
    qs = re.findall(r'\{ id: "([A-Z]+-\d+)", q: "([^"]+)"', bank)

    text = dict(qs)
    toks = {qid: tokens(q) for qid, q in qs}

    pairs = []
    for (a, ta), (b, tb) in combinations(toks.items(), 2):
        if not ta or not tb:
            continue
        jac = len(ta & tb) / len(ta | tb)
        if jac < thresh:
            continue
        # Intentional scenario variants share wording but use different numbers
        # (e.g. the same hemispheric-rule question at two different altitudes).
        # Those are legitimate; filter them out so real duplicates stand out.
        na = set(re.findall(r"\d+", text[a]))
        nb = set(re.findall(r"\d+", text[b]))
        if na and nb and na != nb:
            continue
        pairs.append((jac, a, b))

    pairs.sort(reverse=True)
    print(f"Checked {len(qs)} questions, {len(pairs)} pair(s) above {thresh} similarity\n")
    if not pairs:
        print("No near-duplicates found.")
        return
    print("Review these — numeric scenario variants are already filtered out,")
    print("so remaining pairs are more likely to be genuine restatements worth fixing.\n")
    for jac, a, b in pairs[:25]:
        print(f"[{jac:.2f}] {a} / {b}")
        print(f"    {text[a][:95]}")
        print(f"    {text[b][:95]}\n")


if __name__ == "__main__":
    main()
