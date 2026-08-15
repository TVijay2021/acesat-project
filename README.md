# <img src="./public/icon-maskable.svg" alt="Beacon Logo" width="32" height="32" style="vertical-align: middle; margin-right: 8px;"> Beacon (Offline SAT Coach)

Beacon is an offline-first SAT coach that acts like an agent, not a chatbot.
When the student has internet, it analyzes their practice, decides what to work on next, and prepares a training
route. The student can then train with no WiFi connection at all. Upon
reconnect, Beacon checks whether its own advice actually worked and recalibrates.

**The student is the ship. Beacon is the lighthouse.**

```
CONNECT → ANALYZE → PLAN → PACK → GO OFFLINE → TRAIN → RETURN → LEARN → RESYNC
```

*Submission for the AceSAT Hackathon 2026.*

## What the student sees

Five screens, each answering one question.

**Home — "what should I do right now?"** Opens with *how much time do you have* —
5, 10, 20, or 30+ minutes — and fits the plan to the answer. 
Students can also input their test date and target score, and Beacon plans backwards accordingly.

**Train — "what's packed?"** The full route, offline and ready.

**Review — "what do I keep getting wrong?"** Every missed question with what you
put, what was right, why it went wrong, and the note you wrote to your future
self. Filterable by subject, above a summary of the skills and reasons that keep
recurring. This is the screen for the night before the test.

**Progress — "where am I?"** Accuracy and pacing per area, above your starting
point if you gave one.

**Beacon — "was it right?"** The Decision Ledger.

## Personalization

Beacon adapts how it coaches, not just what it assigns.

**Coaching preferences.** Three choices — how much detail, what tone, what shape
— set at first run and changeable any time. They drive the notes Beacon writes
after a missed question: `concise` gives the instruction alone, `socratic` asks
rather than tells, `bullets` and `step-by-step` change the layout. The settings
screen previews a real note that rewrites itself as you choose, because a
preference whose effect you have to imagine doesn't get set honestly.

**Starting point.** An optional first-run step for previous scores, target, and
test date. Skipping costs nothing; Beacon derives everything else from practice.

**Why Beacon chose this.** Every recommendation carries a collapsed explanation
holding what Beacon observed and what it predicts, linking to the ledger entry
that will later grade that prediction. It shows the evidence a student can check
— not a narration of how the choice was reached.

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

## Architecture

- **Next.js 15 App Router + TypeScript + Tailwind v4** — no component library,
  no chart library, no state-management library, no animation library.
- **Dexie (IndexedDB)** — every screen reads from local storage. Training never
  touches the network. Coaching preferences and the starting point live in
  `localStorage` instead: they are settings rather than learning data, and they
  must be readable before the database opens so the first screen is already in
  the student's chosen voice.
- **Hand-written service worker** — precaches the shell, cache-first for the
  question bank.
- **One Vercel serverless route** (`/api/sync`) — the only code path that talks
  to the network, and the only place an API key is used.

The stored database records which question bank it was seeded against. A build
shipping a different bank rebuilds rather than merges, because routes and
attempts reference questions by id and a half-migrated database surfaces to the
student as an unanswerable question they cannot skip.

### Where the intelligence lives

The decision logic is **deterministic TypeScript**, not a model call:

- `src/lib/agent/analyze.ts` — metrics per focus area (accuracy, median time).
- `src/lib/agent/decide.ts` — ranks weaknesses, picks a focus, and attaches a
  falsifiable prediction. Interventions that keep missing get demoted, so Beacon
  stops prescribing what demonstrably isn't helping.
- `src/lib/agent/grade.ts` — grades a past prediction against later attempts.
- `src/lib/agent/tip.ts` — composes the note to future-you from the mistake
  reason and the question's own explanation, shaped by coaching preferences.
- `src/lib/timeplan.ts` — fits blocks to the time available, and reduces the
  plan to one action when there isn't time for a block. A trimmed block gets its
  own id, so two questions on the bus don't consume the whole session; the
  answers still count, since Beacon grades attempts rather than completions.

Claude (Haiku 4.5) is used for one job: rewriting the computed decision into the
two sentences the student reads. This is a deliberate choice — a model asked
"did your prediction come true?" will tend to say yes, so the grading stays in
code where it is reproducible and auditable. **The app can run fully without an API
key**, falling back to template copy.

The coaching notes are templates for the same reason plus a practical one: they
are written the instant a question is marked wrong, offline, with no key. The
student sees a draft already filled in and can keep it, rewrite it, or clear it
— the point is that a blank box is never the reason the log stays empty.

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
College Board or any other publisher.

`npm run seed` regenerates `src/data/questions.generated.json` from two sources
and fails loudly rather than shipping a thin or malformed bank.

**120 math questions** — `scripts/build-generated-bank.mjs`. Twelve
parameterized templates across Algebra, Advanced Math, Problem-Solving and Data
Analysis, and Geometry and Trigonometry. Stems, answers, and distractors are all
computed. Distractors encode real student errors — a sign flip, treating
exponential decay as linear, inverting a similar-triangle ratio, stopping before
the square root — so a wrong answer is diagnostic rather than noise.

**41 Reading and Writing questions** — `scripts/authored-reading-writing.mjs`.
Reading questions can't be templated; the judgement *is* the question. These are
written by hand over original passages, covering Words in Context, Transitions,
Command of Evidence, Central Ideas, Inferences, Text Structure and Purpose,
Rhetorical Synthesis, Cross-Text Connections, Boundaries, and Form, Structure,
and Sense.

The build validates both sets: exactly four distinct choices, a key that
resolves to a real choice and the correct answer
rotated evenly across A–D so no letter is worth guessing.

### Calibration

`src/data/question-bank-profile.json` holds the format conventions the bank is
written against — per-skill shares, difficulty mix, and passage, stem, and
choice length bands. It is measured data: how long a Words in Context passage
runs (~48 words) against a Cross-Text Connections pair (~129), and which stem
phrasings are standard. Authored items are written to those bands so the
practice material matches the shape of the real thing.

## Accessibility

Built for students on older phones, small screens, and intermittent
connectivity: offline is a first-class state (never an error), high contrast in
both light and dark mode themes, large touch targets, reduced-motion honoured,
and no information conveyed by color alone.

## Demos
> Home - Page

![Home Page Demo](images/HomePageDemo.gif)

## AI-assisted development

This project was developed with assistance from Claude (Anthropic). The conceptual framework of this project was  human-designed, and the AI was used to execute human-initiated prompts. We thoroughly reviewed, edited, and tested the code to ensure its functionality.
