# License to Learn — PPL Written Exam Prep

A free Canadian PPL/PPAER written exam study tool: **510 verified practice questions** achieving **100% coverage of the TP 12880 syllabus**, 10 interactive practice calculators (wind triangle, weight & balance, crosswind component, true airspeed, CG shift, METAR/TAF decoding, and more — an 11th, instrument reading, exists in the code but is currently hidden from the picker), a 99-term glossary, a syllabus tracker with attempt-based readiness, and a full mock exam mode.

This is the self-hosted (Vite) port of the original Claude artifact, per the Azure self-hosting roadmap. This is **Phase 0** — it runs locally with `localStorage`, with no backend yet.

**This export was freshly regenerated from the live artifact** (previously it had drifted significantly stale — 309 questions and 7 calculators vs. the current 510/10+1). If you're reading this much later and suspect it's drifted again, ask for a fresh re-export before relying on it; these two codebases don't sync automatically.

## ⚠️ Important: this hasn't been run yet

This project was assembled by extracting and reorganizing already-validated code from the single-file artifact into proper modules, then verified with static checks (every file's brace/paren balance, every `import` resolving to a real `export`, every JSX component tag resolving to a known name). **It has not actually been built or run**, since the environment that assembled it has no network access to run `npm install`. Please run the steps below and treat the first `npm run dev` as the real first test.

If something doesn't compile, the most likely culprits, in order:
1. A subtle import path typo (check the exact relative paths in each file's imports)
2. A missing dependency version mismatch (the `package.json` versions were chosen as reasonably current at time of writing — bump anything Vite/npm complains about)
3. JSX syntax the extraction accidentally split mid-expression (search for the error's line number and compare it against the same logic in the original artifact file, if you still have it, to spot the difference)

## Setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173` by default.

```bash
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

## Project structure

```
staticwebapp.config.json  # SPA routing fallback for Azure SWA; also where auth-gated routes would go later
src/
  data/
    questions.js    # the full QUIZ_BANK + shuffle/lookup helpers
    syllabus.js      # the 4-leg syllabus + section mapping
    glossary.js      # glossary terms
  lib/
    storage.js        # the storage adapter (localStorage here; swap for a cloud API later)
    quizSession.js    # paused-quiz persistence + attempt-based scoring
    mockExam.js        # mock exam generation, persistence, scoring
    calculators.js     # pure-math problem generators for all 11 calculators (10 wired in + Instrument Reading, hidden)
    auth.js             # Azure SWA built-in auth (/.auth/*) helpers — identity only, not yet wired to data
    useAuth.js           # hook that checks /.auth/me once on mount
  components/
    shared.jsx         # BottomTabBar, Stat, CalcHeader, NumberField, AuthStatus, etc.
    QuizCard.jsx
    Calculators.jsx    # all 11 calculator UI components (10 wired in + Instrument Reading, hidden)
    Glossary.jsx
    MockExam.jsx        # setup / active / results screens
  theme.js              # the Squamish-inspired color palette
  App.jsx                # main app component + ErrorBoundary
  main.jsx                # entry point
```

This split follows the "M1/M2" recommendations from the app's own code review: data, pure logic, and UI are separated, and the previously-2,600-line single component is now organized into modules a person can actually navigate.

## Auth: what's here, what isn't

A minimal sign-in/sign-out affordance backed by [Azure Static Web Apps' built-in authentication](https://learn.microsoft.com/en-us/azure/static-web-apps/authentication-authorization) is wired in (`lib/auth.js`, `lib/useAuth.js`, and the `AuthStatus` component, shown top-right of every screen).

- **It's identity only.** Signing in shows a username and gives you a real, unique logged-in user — but progress still lives entirely in `localStorage`, unscoped to that user. Two people signed into the same browser would currently share the same local data. Wiring auth to actual per-user data (and offering to migrate someone's existing local progress into their account) is future work, not yet built.
- **`/.auth/*` routes don't exist under plain `vite dev`.** They're provided by the SWA runtime itself. `fetchCurrentUser()` degrades gracefully in that case — `user` is just `null`, same as being signed out — so nothing breaks locally, but you also won't see login actually work until either:
  - you deploy to Azure Static Web Apps, or
  - you run the [Static Web Apps CLI emulator](https://github.com/Azure/static-web-apps-cli) (`swa start`) locally instead of/alongside Vite dev.
- **Only the default identity providers work out of the box** (GitHub, Google, Twitter/X, Microsoft/Entra) — these are pre-registered by SWA on every tier including Free. Custom OIDC providers are a Standard-tier ($9/mo) feature.
- **No routes are gated yet.** `staticwebapp.config.json` only has SPA routing fallback configured. To require sign-in for part of the app later, add an `allowedRoles` rule under `routes` there.

## What's NOT done yet (see the Azure roadmap)

- **Custom hooks extraction (M1)**: `App.jsx`'s main component still holds all the state and effects directly rather than being broken into `usePersistentState`/`useQuizSession`/`useReadiness` hooks. The file split makes this the natural next step, but it wasn't done in this pass.
- **PWA icons**: `public/manifest.json` has an empty `icons` array — add real icon PNGs (192×192 and 512×512 are the standard sizes) before this is installable as a home-screen app.
- **Accessibility pass (H2)**: still pending — see the code review for specifics (aria attributes, label associations, SVG text alternatives, focus indicators).
- **Deployment**: this only runs locally right now. Phase 1 of the Azure roadmap covers deploying to Azure Static Web Apps.
- **Per-user data**: login (see above) is identity only — progress isn't yet scoped per signed-in user, and there's no "migrate my local progress into my account" flow. That's the real Phase 3 work.
- **Tests**: none yet. The pure functions in `lib/calculators.js` and `lib/mockExam.js` are the best first targets — they're already used with real assertions when this was validated on the Claude side (Node execution, not a proper test framework), so porting those checks into Vitest would be quick.

## Data model note

Progress, quiz attempts, paused quizzes, and mock exam state all persist as one JSON blob under a single `localStorage` key (see `lib/storage.js` for the exact key). Paused quizzes and the mock exam store question **references** (IDs + option order), not full question objects, to keep the payload small and always show current question wording even after edits to the bank.
