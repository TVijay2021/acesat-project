import bank from "../data/questions.json";
import { db } from "./db";
import type { Attempt, Decision, Question, Route, TrainingSession } from "./types";

const questions = bank.questions as Question[];

const DAY = 86_400_000;

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
  if (existing > 0) return;

  await db.questions.bulkPut(questions);

  const now = Date.now();
  const attempts: Attempt[] = [];
  let clock = now - 14 * DAY;

  function log(question: Question, correct: boolean, elapsedMs: number) {
    clock += 4 * 60_000;
    attempts.push({
      questionId: question.id,
      sessionId: `history-${Math.floor((now - clock) / DAY)}`,
      response: correct ? question.answer : wrongAnswer(question),
      correct,
      elapsedMs,
      confidence: correct ? "sure" : "unsure",
      mistakeReason: correct ? null : "rushed",
      answeredAt: clock,
      synced: true,
    });
  }

  const byDomain = (domain: string) =>
    questions.filter((q) => q.domain === domain);

  // Knows algebra, burns clock on it. This is the pattern Beacon should find.
  for (const [i, q] of byDomain("Algebra").entries()) {
    log(q, i !== 1, 88_000 + i * 4_000);
  }
  for (const [i, q] of byDomain("Advanced Math").entries()) {
    log(q, i % 3 !== 0, 74_000);
  }
  // A genuine knowledge gap, slower to move.
  for (const [i, q] of byDomain("Craft and Structure").entries()) {
    log(q, i % 3 === 0, 52_000);
  }
  for (const [i, q] of byDomain("Information and Ideas").entries()) {
    log(q, i !== 2, 48_000);
  }
  for (const q of byDomain("Problem-Solving and Data Analysis")) {
    log(q, true, 46_000);
  }

  await db.attempts.bulkAdd(attempts);
  await db.decisions.bulkPut(seedDecisions(now));

  const route = seedRoute(now);
  await db.routes.put(route);
  await db.sessions.bulkPut(seedSessions(route, now));
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
    questions
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
