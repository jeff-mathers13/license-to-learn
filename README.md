# License to Learn — PPL Written Exam Prep

A free Canadian PPL/PPAER written exam study tool: **510 verified practice questions** achieving **100% coverage of the TP 12880 syllabus**, 10 interactive practice calculators (wind triangle, weight & balance, crosswind component, true airspeed, CG shift, METAR/TAF decoding, and more — an 11th, instrument reading, exists in the code but is currently hidden from the picker), a 99-term glossary, a syllabus tracker with attempt-based readiness, and a full mock exam mode.

Live at **[licensed2learn.com](https://licensed2learn.com)**, deployed on Azure Static Web Apps.

## Setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173` by default.

```bash
npm run build     # production build to dist/
npm run preview   # preview the production build locally
npm run swa       # build, then run the SWA CLI emulator (serves dist/ + api/ + a fake-login auth emulator together)
```

## Project structure

```
public/
  staticwebapp.config.json  # SPA routing fallback + /api/* auth gate for Azure SWA — lives in public/ so Vite copies it into dist/
  manifest.json, favicon-*.png, icon-*.png, og-image-1200x630.png
api/
  src/functions/progress.js  # Azure Function backing /api/progress (cloud sync — see below)
src/
  data/
    questions.js    # the full QUIZ_BANK + shuffle/lookup helpers
    syllabus.js      # the 4-leg syllabus + section mapping
    glossary.js      # glossary terms
  lib/
    storage.js         # the storage adapter — localStorage by default, /api/progress once a user is signed in
    quizSession.js      # paused-quiz persistence + attempt-based scoring
    mockExam.js          # mock exam generation, persistence, section scoring
    calculators.js        # pure-math problem generators for all 11 calculators (10 wired in + Instrument Reading, hidden)
    auth.js                # Azure SWA built-in auth (/.auth/*) helpers
    useAuth.js               # hook that checks /.auth/me once on mount
    themePreference.js        # light/dark/system display preference (device-local, not synced)
    quizPreference.js          # quiz session length preference (All/10/20/50, device-local, not synced)
  components/
    shared.jsx         # BottomTabBar, Stat, AuthStatus, SettingsModal, etc.
    QuizCard.jsx
    Calculators.jsx    # all 11 calculator UI components (10 wired in + Instrument Reading, hidden)
    Glossary.jsx
    MockExam.jsx        # setup / active / results screens
  theme.js              # the Squamish-inspired color palette (light + dark)
  App.jsx                # main app component + ErrorBoundary
  main.jsx                # entry point
.claude/skills/
  ppl-quiz-writer/       # Agent Skill for writing new quiz questions against the TP 12880 syllabus map
```

The main component still holds most state and effects directly in `App.jsx` rather than being broken out into custom hooks — see "What's not done yet" below.

## Deploying

The GitHub Actions workflow at `.github/workflows/azure-static-web-apps-*.yml` builds and deploys on every push to `main`, and also builds a **PR preview environment** for every open pull request (via Azure SWA's built-in preview-environment support), tearing it down when the PR closes or merges. Opening a PR against `main` — even solo — gets you a real staging URL to click through before merging.

## Auth: what's here, what isn't

A minimal sign-in/sign-out affordance backed by [Azure Static Web Apps' built-in authentication](https://learn.microsoft.com/en-us/azure/static-web-apps/authentication-authorization) is wired in (`lib/auth.js`, `lib/useAuth.js`, and the `AuthStatus` component, shown top-right of every screen).

- **Signing in scopes your data to your account** (see "Cloud sync" below) — progress follows you across devices once you're signed in. Signed-out use is unaffected: everything still works entirely offline in `localStorage`.
- **`/.auth/*` routes don't exist under plain `vite dev`.** They're provided by the SWA runtime itself. `fetchCurrentUser()` degrades gracefully in that case — `user` is just `null`, same as being signed out — so nothing breaks locally, but you won't see login actually work, and `/api/*` won't be reachable either, until either:
  - you're on the real deploy, or
  - you run the [Static Web Apps CLI emulator](https://github.com/Azure/static-web-apps-cli) (`npm run swa`) locally instead of/alongside Vite dev — see "Cloud sync" below.
- **Only the default identity providers work out of the box** (GitHub, Google, Twitter/X, Microsoft/Entra) — these are pre-registered by SWA on every tier including Free. Custom OIDC providers are a Standard-tier ($9/mo) feature.
- **`/api/*` is gated** via `staticwebapp.config.json`'s `allowedRoles: ["authenticated"]` rule — anonymous requests are rejected at SWA's edge before they ever reach the Functions app.

## Cloud sync (cross-device progress)

Once signed in, `storage.js` routes `get`/`set` to `GET`/`PUT /api/progress` (an Azure Function in `api/`) instead of `localStorage`, keyed by your SWA-issued `userId`. Signed-out use is entirely unchanged.

**Local dev**, from the repo root:
```bash
npm install -g azure-functions-core-tools@4 --unsafe-perm true   # once, if not already installed
npm run swa
```
`api/local.settings.json` points the Function at [Azurite](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite) (`UseDevelopmentStorage=true`) — run `azurite` (or `docker run -p 10000:10000 mcr.microsoft.com/azure-storage/azurite`) alongside `npm run swa` so the Function has somewhere to write. The `swa start` login screen is a **fake identity picker**, not real GitHub OAuth — it's enough to test the plumbing (does a blob get written/read, does the migration banner appear), but not to confirm real sign-in works end-to-end; that can only be verified on the real deploy.

**Known limitations (v1, not oversights):**
- Last-write-wins at the whole-progress-blob level — no merge if two devices save within moments of each other.
- Signing in with a *different* identity provider (e.g. Google instead of GitHub) is a different account to SWA — same person, different `userId`, so progress won't follow across providers.
- No real-time push between devices — reload to see updates made elsewhere.

**Deploying this**: besides the GitHub Actions workflow (already set up to build and deploy `api/` alongside the app), you need to separately: (1) create an Azure Storage Account + a `progress` blob container, and (2) set `PROGRESS_STORAGE_CONNECTION_STRING` as an Application Setting on the Static Web App resource (Azure Portal → your app → Configuration, or `az staticwebapp appsettings set`). Neither step can be done from this repo/CI alone.

## Device-local preferences

Two settings live in `localStorage` only and are deliberately **not** part of the cloud-synced progress payload, so they can differ per device: appearance (`themePreference.js` — Light/Dark/System, defaults to Light) and quiz session length (`quizPreference.js` — All/10/20/50, defaults to All). Both are editable from the Settings panel (gear icon, top-right).

## What's not done yet

- **Custom hooks extraction**: `App.jsx`'s main component still holds all the state and effects directly rather than being broken into `usePersistentState`/`useQuizSession`/`useReadiness`-style hooks.
- **Accessibility pass**: still pending — aria attributes, label associations, SVG text alternatives, and focus indicators haven't had a dedicated review.
- **Tests**: none yet. The pure functions in `lib/calculators.js` and `lib/mockExam.js` are the best first targets for a Vitest suite.

## Data model note

Progress, quiz attempts, paused quizzes, and mock exam state all persist as one JSON blob — under a single `localStorage` key when signed out (see `lib/storage.js` for the exact key), or as `progress/{userId}.json` in Blob Storage once signed in (see `api/src/functions/progress.js`). Paused quizzes and the mock exam store question **references** (IDs + option order), not full question objects, to keep the payload small and always show current question wording even after edits to the bank.
