import generatedBank from "../data/questions.generated.json";
import { db } from "./db";
import { suggestTip } from "./agent/tip";
import type {
  Attempt,
  Confidence,
  Decision,
  MistakeReason,
  Question,
  Route,
  TrainingSession,
} from "./types";

const allQuestions = generatedBank.questions as Question[];

const DAY = 86_400_000;

/**
 * Identifies the bank this database was seeded against.
 *
 * Routes, sessions, and attempts all reference questions by id. A build that
 * ships a different bank leaves a previously seeded database pointing at ids
 * that no longer exist, and the student meets that as "this question isn't
 * available offline yet" on a question they cannot skip. So the fingerprint is
 * checked on every load, not just when the database is empty.
 */
const BANK_FINGERPRINT = [
  allQuestions.length,
  allQuestions[0]?.id ?? "none",
  allQuestions[allQuestions.length - 1]?.id ?? "none",
].join(":") + ":v3";

const FINGERPRINT_KEY = "beacon.bank";

function readFingerprint(): string | null {
  try {
    return localStorage.getItem(FINGERPRINT_KEY);
  } catch {
    // Private mode or blocked storage: treat as unknown and reseed.
    return null;
  }
}

function writeFingerprint(): void {
  try {
    localStorage.setItem(FINGERPRINT_KEY, BANK_FINGERPRINT);
  } catch {
    // Not fatal — the app works, it just reseeds again next load.
  }
}

/**
 * Seeds a student with a history worth reasoning about. Without this the first
 * screen a judge sees is an empty state, and the Decision Ledger — the whole
 * point of the product — has nothing in it.
 *
 * The shape is deliberate: strong algebra accuracy but slow, weak on Craft and
 * Structure, and a ledger where one of Beacon's own predictions missed.
 */
export async function seedIfEmpty(): Promise<void> {
  const existing = await db.questions.count();
  if (existing > 0 && readFingerprint() === BANK_FINGERPRINT) return;

  if (existing > 0) {
    // Rebuild rather than merge. Attempts, decisions, and packed routes all
    // point at question ids from the previous bank, and a half-migrated
    // database fails in more confusing ways than a fresh one.
    await db.transaction(
      "rw",
      [db.questions, db.attempts, db.sessions, db.routes, db.decisions, db.cards],
      async () => {
        await Promise.all([
          db.questions.clear(),
          db.attempts.clear(),
          db.sessions.clear(),
          db.routes.clear(),
          db.decisions.clear(),
          db.cards.clear(),
        ]);
      }
    );
  }

  await db.questions.bulkPut(allQuestions);

  const now = Date.now();
  const attempts: Attempt[] = [];
  let clock = now - 14 * DAY;

  // Rotated so the Review tab opens on a real spread of reasons rather than
  // one repeated label, and so "what keeps catching you" has something to say.
  const REASONS: MistakeReason[] = [
    "rushed",
    "misread",
    "concept",
    "careless",
    "overthought",
    "wrong-strategy",
  ];
  let missCount = 0;

  function log(
    question: Question,
    correct: boolean,
    elapsedMs: number,
    confidence: Confidence = correct ? "sure" : "unsure"
  ) {
    clock += 4 * 60_000;
    const reason = correct ? null : REASONS[missCount++ % REASONS.length];
    attempts.push({
      questionId: question.id,
      sessionId: `history-${Math.floor((now - clock) / DAY)}`,
      response: correct ? question.answer : wrongAnswer(question),
      correct,
      elapsedMs,
      confidence,
      mistakeReason: reason,
      // The note is the point of the log, so seeded misses carry one too.
      note: reason ? suggestTip(question, reason) : undefined,
      answeredAt: clock,
      synced: true,
    });
  }

  // Fixed-size slices. The bank is free to grow without changing the accuracy
  // and pacing figures this history is tuned to produce.
  const byDomain = (domain: string, count: number) =>
    allQuestions.filter((q) => q.domain === domain).slice(0, count);

  // Knows algebra, burns clock on it. This is the pattern Beacon should find.
  for (const [i, q] of byDomain("Algebra", 6).entries()) {
    log(q, i !== 1, 88_000 + i * 4_000);
  }
  for (const [i, q] of byDomain("Advanced Math", 6).entries()) {
    log(q, i % 3 !== 0, 74_000);
  }
  // A genuine knowledge gap, slower to move — and the student does not know
  // it yet. Rating these "sure" is what gives the confidence check something
  // true to say on the first load, rather than an empty state.
  for (const [i, q] of byDomain("Craft and Structure", 6).entries()) {
    log(q, i % 3 === 0, 52_000, "sure");
  }
  for (const [i, q] of byDomain("Information and Ideas", 5).entries()) {
    log(q, i !== 2, 48_000);
  }
  for (const q of byDomain("Problem-Solving and Data Analysis", 3)) {
    log(q, true, 46_000);
  }

  // Offline training the student did *after* Beacon's last decision. These are
  // what the next check-in grades that prediction against — without them the
  // first sync has no new evidence and the ledger stays pending, which hides
  // the whole point of the product on the first screen a judge touches.
  for (const [i, q] of byDomain("Algebra", 6).entries()) {
    clock = now - 1.5 * DAY + i * 5 * 60_000;
    attempts.push({
      questionId: q.id,
      sessionId: "sess-1",
      response: i === 4 ? wrongAnswer(q) : q.answer,
      correct: i !== 4,
      // Faster than the 88s baseline, and accuracy holds — so the prediction
      // confirms rather than tripping the accuracy guard.
      elapsedMs: 69_000 + i * 1_500,
      confidence: "sure",
      mistakeReason: i === 4 ? "careless" : null,
      note: i === 4 ? suggestTip(q, "careless") : undefined,
      answeredAt: clock,
      synced: false,
    });
  }

  await db.attempts.bulkAdd(attempts);
  await db.decisions.bulkPut(seedDecisions(now));

  const route = seedRoute(now);
  await db.routes.put(route);
  await db.sessions.bulkPut(seedSessions(route, now));

  writeFingerprint();
}

function wrongAnswer(question: Question): string {
  const other = question.choices.find((c) => c.label !== question.answer);
  return other?.label ?? "—";
}

/**
 * Three graded decisions and one pending. The missed one is the important
 * entry: it shows Beacon checking itself and changing course.
 */
function seedDecisions(now: number): Decision[] {
  return [
    {
      id: "dec-1",
      createdAt: now - 12 * DAY,
      focus: "Grammar conventions",
      evidence:
        "You missed 3 of 4 comma and modifier questions in your first week.",
      action: "Assigned two grammar rep sets.",
      prediction: "Your accuracy on conventions questions will rise.",
      predictionCheck: {
        metric: "accuracy",
        scope: { domain: "Standard English Conventions" },
        direction: "increase",
        baseline: 0.25,
        threshold: 0.15,
      },
      outcome: "missed",
      outcomeNote:
        "Your accuracy moved from 25% to 28%, short of the target.",
      gradedAt: now - 9 * DAY,
      authored: false,
    },
    {
      id: "dec-2",
      createdAt: now - 9 * DAY,
      focus: "Evidence questions",
      evidence:
        "Grammar drills did not move your score, but your evidence questions showed the widest gap between confidence and accuracy.",
      action: "Assigned three evidence-locating sets.",
      prediction: "Your accuracy on evidence questions will rise.",
      predictionCheck: {
        metric: "accuracy",
        scope: { domain: "Information and Ideas" },
        direction: "increase",
        baseline: 0.5,
        threshold: 0.15,
      },
      outcome: "confirmed",
      outcomeNote: "Your accuracy rose from 50% to 80%.",
      gradedAt: now - 5 * DAY,
      authored: false,
    },
    {
      id: "dec-3",
      createdAt: now - 5 * DAY,
      focus: "Timing under pressure",
      evidence:
        "You are answering algebra questions accurately but spending far longer on them than your average.",
      action: "Assigned three skip-and-return drills.",
      prediction: "Your pacing will improve without reducing accuracy.",
      predictionCheck: {
        metric: "medianTimeMs",
        scope: { domain: "Algebra" },
        direction: "decrease",
        baseline: 104_000,
        threshold: 0.12,
        guardAccuracy: 0.78,
      },
      outcome: "confirmed",
      outcomeNote:
        "Your pacing improved by 16 seconds per question while accuracy held at 83%.",
      gradedAt: now - 2 * DAY,
      authored: false,
    },
    {
      id: "dec-4",
      createdAt: now - 2 * DAY,
      focus: "Timing under pressure",
      evidence:
        "You are answering Algebra questions at 83% accuracy, but spending 82% longer than your average.",
      action: "Assigned three skip-and-return drills.",
      prediction: "Your pacing will improve without reducing accuracy.",
      predictionCheck: {
        metric: "medianTimeMs",
        scope: { domain: "Algebra" },
        direction: "decrease",
        baseline: 88_000,
        threshold: 0.12,
        guardAccuracy: 0.78,
      },
      outcome: "pending",
      outcomeNote: null,
      gradedAt: null,
      authored: false,
    },
  ];
}

function seedRoute(now: number): Route {
  return {
    id: "route-1",
    createdAt: now - 2 * DAY,
    primaryFocus: "Timing under pressure",
    secondaryFocus: "Craft and Structure",
    rationale:
      "You're answering medium-difficulty math questions accurately, but spending 82% longer than your recent average.",
    days: 4,
    decisionId: "dec-4",
  };
}

function seedSessions(route: Route, now: number): TrainingSession[] {
  const pick = (domain: string, n: number, offset = 0) =>
    allQuestions
      .filter((q) => q.domain === domain)
      .slice(offset, offset + n)
      .map((q) => q.id);

  return [
    {
      id: "sess-1",
      routeId: route.id,
      title: "Timing Sprint",
      kind: "timing",
      intent: "Improve skip-and-return decisions.",
      estimatedMinutes: 8,
      questionIds: pick("Algebra", 4),
      completedAt: now - 1 * DAY,
      day: 0,
    },
    {
      id: "sess-2",
      routeId: route.id,
      title: "Timing Sprint",
      kind: "timing",
      intent: "Hold your pace when a question looks long.",
      estimatedMinutes: 8,
      questionIds: pick("Advanced Math", 4),
      day: 1,
      completedAt: null,
    },
    {
      id: "sess-3",
      routeId: route.id,
      title: "Reading Evidence",
      kind: "reading",
      intent: "Practise finding the exact sentence that supports an answer.",
      estimatedMinutes: 12,
      questionIds: pick("Craft and Structure", 4),
      day: 2,
      completedAt: null,
    },
    {
      id: "sess-4",
      routeId: route.id,
      title: "Mixed Set",
      kind: "strategy",
      intent: "Keep both focus areas warm under time.",
      estimatedMinutes: 10,
      questionIds: [...pick("Algebra", 2, 4), ...pick("Information and Ideas", 2)],
      day: 3,
      completedAt: null,
    },
  ];
}
