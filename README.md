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
npm run seed   # rebuilds the question bank
npm run test   # proves the decide -> predict -> grade loop
npm run dev
```

Set `ANTHROPIC_API_KEY` in `.env.local` to enable Claude-authored explanations.
Without it, everything still works.

## Question bank

161 questions, all original. Nothing in this repository is reproduced from
College Board or any other publisher — see [Content and licensing](#content-and-licensing).

`npm run seed` regenerates `src/data/questions.generated.json` from two sources
and fails loudly rather than shipping a thin or malformed bank.

**120 math questions** — `scripts/build-generated-bank.mjs`. Twelve
parameterised templates across Algebra, Advanced Math, Problem-Solving and Data
Analysis, and Geometry and Trigonometry. Stems, answers, and distractors are all
computed. Distractors encode real student errors — a sign flip, treating
exponential decay as linear, inverting a similar-triangle ratio, stopping before
the square root — so a wrong answer is diagnostic rather than noise. The
generator is seeded, so the bank is identical on every machine.

**41 Reading and Writing questions** — `scripts/authored-reading-writing.mjs`.
Reading questions can't be templated; the judgement *is* the question. These are
written by hand over original passages, covering Words in Context, Transitions,
Command of Evidence, Central Ideas, Inferences, Text Structure and Purpose,
Rhetorical Synthesis, Cross-Text Connections, Boundaries, and Form, Structure,
and Sense.

The build validates both sets: exactly four distinct choices, a key that
resolves to a real choice, no NaN or empty values, and the correct answer
rotated evenly across A–D so no letter is worth guessing.

### Calibration

`src/data/question-bank-profile.json` holds the format conventions the bank is
written against — per-skill shares, difficulty mix, and passage, stem, and
choice length bands. It is measured data: how long a Words in Context passage
runs (~48 words) against a Cross-Text Connections pair (~129), and which stem
phrasings are standard. Authored items are written to those bands so the
practice material matches the shape of the real thing.

### Known gap

The bank is 74% math against roughly 44% on the real test. Math generates
cheaply and reading does not. The next work is more authored Reading and Writing
items — Standard English Conventions (6) and Expression of Ideas (9) are
thinnest, and a route focused on either will start repeating questions.

## Content and licensing

Every question here is original to this project. The math items are computed
from templates written for this repository; the reading items were authored for
it, over passages written for it.

This is a deliberate constraint rather than an accident. College Board's
publicly released sample questions and its Educator Question Bank are both ©
College Board, and the licence covering the question bank permits classroom
teaching and internal reporting — not reproduction, redistribution, or posting
online. An app that is hosted, demoed, and committed to a public repository does
all three. "Freely accessible" is not a licence, and the absence of a copyright
notice on an export grants nothing: protection has been automatic since 1989.

The calibration profile is derived from published question banks but contains
only unprotected facts — counts, distributions, length bands, and standardised
stem formats. No passage, answer choice, or rationale from any third party
appears in this repository. Facts and formats are not copyrightable; expression
is, and none of it is here.

## Accessibility

Built for students on older phones, small screens, and intermittent
connectivity: offline is a first-class state (never an error), high contrast in
both themes, large touch targets, keyboard navigable, reduced-motion honoured,
and no information conveyed by colour alone.

## AI Acknowledgement
We acknowledge the use of Claude to assist with code generation  for this project. The conceptual framework of this project was  human-designed, and the AI was used to execute human-initiated prompts. We thoroughly reviewed, edited, and tested the code to ensure its functionality. The implementation reflects our work and verification.