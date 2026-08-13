# Beacon — Offline SAT Coach

Beacon is an offline-first SAT coaching PWA. When the student has internet, it
analyses their practice, decides what to work on next, and packs a training
route onto the device. The student then trains with no connection at all. On
reconnect, Beacon checks whether its own advice actually worked and recalibrates.

**The student is the ship. Beacon is the lighthouse.**

```
CONNECT → ANALYZE → PLAN → PACK → GO OFFLINE → TRAIN → RETURN → LEARN → RECALIBRATE
```

## Why this is not a chatbot

The defining feature is the **Decision Ledger**. Beacon doesn't just recommend —
every decision it makes carries a falsifiable prediction, and a later sync grades
that prediction in code:

| | |
|---|---|
| **Decision** | Focus on timing rather than algebra. |
| **Evidence** | 5 of your last 6 algebra questions were correct, but your median time was 90% above your baseline. |
| **Action** | Assigned three skip-and-return drills. |
| **Prediction** | Your pacing will improve without reducing accuracy. |
| **Outcome** | Confirmed — pacing improved by 25s per question while accuracy held at 83%. |

Beacon records when it was **wrong**, too, and changes approach. That self-check
is the product.

## Architecture

- **Next.js 15 App Router + TypeScript + Tailwind v4** — no component library,
  no chart library, no state-management library, no animation library.
- **Dexie (IndexedDB)** — every screen reads from local storage. Training never
  touches the network.
- **Hand-written service worker** — precaches the shell, cache-first for the
  question bank.
- **One Vercel serverless route** (`/api/sync`) — the only code path that talks
  to the network, and the only place an API key is used.

### Where the intelligence lives

The decision logic is **deterministic TypeScript**, not a model call:

- `src/lib/agent/analyze.ts` — metrics per focus area (accuracy, median time).
- `src/lib/agent/decide.ts` — ranks weaknesses, picks a focus, and attaches a
  falsifiable prediction. Interventions that keep missing get demoted, so Beacon
  stops prescribing what demonstrably isn't helping.
- `src/lib/agent/grade.ts` — grades a past prediction against later attempts.

Claude (Haiku 4.5) is used for one job: rewriting the computed decision into the
two sentences the student reads. This is a deliberate choice — a model asked
"did your prediction come true?" will tend to say yes, so the grading stays in
code where it is reproducible and auditable. **The app runs fully without an API
key**, falling back to template copy.

## Running it

```bash
npm install
npm run seed   # builds the question bank from the source text
npm run test   # proves the decide -> predict -> grade loop
npm run dev
```

Set `ANTHROPIC_API_KEY` in `.env.local` to enable Claude-authored explanations.
Without it, everything still works.

## Question bank

33 questions parsed from College Board's publicly released *Digital SAT Sample
Questions and Answer Explanations*, with domain, skill, answer key, and full
explanations preserved. `scripts/build-question-bank.mjs` regenerates
`src/data/questions.json` and fails loudly rather than shipping a partial parse.

## Accessibility

Built for students on older phones, small screens, and intermittent
connectivity: offline is a first-class state (never an error), high contrast in
both themes, large touch targets, keyboard navigable, reduced-motion honoured,
and no information conveyed by colour alone.
