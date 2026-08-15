import type { Attempt, Decision, Question, TrainingSession } from "./types";

/** Minutes the student says they have. 30 means "30 or more". */
export type TimeBudget = 5 | 10 | 20 | 30;

export const TIME_BUDGETS: { value: TimeBudget; label: string }[] = [
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30+ min" },
];

export interface OneThing {
  /** The single action, phrased as something to do now. */
  headline: string;
  /** The evidence for choosing it. Never chain-of-thought. */
  reason: string;
  minutes: number;
  /** A ready-to-run block, trimmed to fit. */
  session: TrainingSession;
}

export interface TimePlan {
  /** Blocks that fit the budget, highest leverage first. */
  blocks: TrainingSession[];
  totalMinutes: number;
  /** Present when the budget is too small for a full block. */
  oneThing: OneThing | null;
}

/** Roughly how long a question takes, used when trimming a block to fit. */
const MINUTES_PER_QUESTION = 2;

/**
 * Chooses what is worth doing in the time available.
 *
 * The route is already ordered by priority — day 0 is the primary weakness —
 * so fitting the budget is a greedy walk down that order rather than a
 * reshuffle. Nothing is invented: a short budget trims an existing block
 * instead of inventing a new kind of work.
 */
export function planForTime(
  budget: TimeBudget,
  sessions: TrainingSession[],
  decisions: Decision[],
  attempts: Attempt[],
  questions: Map<string, Question>
): TimePlan {
  const remaining = sessions
    .filter((s) => s.completedAt === null)
    .sort((a, b) => a.day - b.day);

  // Questions already answered are not worth serving again inside the same
  // route — a short second sitting should move the student forward.
  const answered = new Set(attempts.map((a) => a.questionId));

  if (remaining.length === 0) {
    return { blocks: [], totalMinutes: 0, oneThing: null };
  }

  // Under ten minutes there is time for one focused thing, not a plan.
  if (budget <= 5) {
    return {
      blocks: [],
      totalMinutes: 0,
      oneThing: buildOneThing(remaining[0], decisions, attempts, questions, 2, answered),
    };
  }

  const blocks: TrainingSession[] = [];
  let used = 0;

  for (const session of remaining) {
    if (used + session.estimatedMinutes <= budget) {
      blocks.push(session);
      used += session.estimatedMinutes;
      continue;
    }
    // Part of a block still beats none, but only if a real slice of it fits.
    const spare = budget - used;
    if (blocks.length === 0 && spare >= MINUTES_PER_QUESTION * 2) {
      const count = Math.floor(spare / MINUTES_PER_QUESTION);
      blocks.push(trim(session, count, answered));
      used += count * MINUTES_PER_QUESTION;
    }
    break;
  }

  if (blocks.length === 0) {
    return {
      blocks: [],
      totalMinutes: 0,
      oneThing: buildOneThing(remaining[0], decisions, attempts, questions, 2, answered),
    };
  }

  return { blocks, totalMinutes: used, oneThing: null };
}

/**
 * A shorter version of a block.
 *
 * The trimmed block gets its own id so it is distinguishable in the UI, and
 * `sourceId` points back at the stored row so finishing it still advances the
 * route. Without that link the student finishes the work Beacon asked for and
 * the home screen recommends the very same thing again.
 *
 * Questions the student has already answered are dropped first, so a second
 * short session serves new material rather than repeating the first two.
 */
function trim(
  session: TrainingSession,
  count: number,
  answered: Set<string> = new Set()
): TrainingSession {
  const wanted = Math.max(1, count);
  const unanswered = session.questionIds.filter((id) => !answered.has(id));
  const pool = unanswered.length > 0 ? unanswered : session.questionIds;
  if (wanted >= pool.length && pool.length === session.questionIds.length) {
    return session;
  }

  const questionIds = pool.slice(0, wanted);
  return {
    ...session,
    id: `${session.id}-part`,
    sourceId: session.sourceId ?? session.id,
    questionIds,
    estimatedMinutes: Math.max(2, questionIds.length * MINUTES_PER_QUESTION),
  };
}

/**
 * The single highest-leverage action.
 *
 * Preference order: the prediction Beacon is currently testing, then the skill
 * that has cost the most marks. Both are evidence the student can check.
 */
function buildOneThing(
  session: TrainingSession,
  decisions: Decision[],
  attempts: Attempt[],
  questions: Map<string, Question>,
  count: number,
  answered: Set<string>
): OneThing {
  const trimmed = trim(session, count, answered);
  const pending = decisions.find((d) => d.outcome === "pending");
  const served = trimmed.questionIds.length;

  if (pending) {
    return {
      // Named after the work actually being served, not the standing focus.
      // Keying the headline off the pending decision made every block read
      // "questions on timing under pressure", so the screen looked frozen even
      // as the route advanced underneath it.
      headline: `${served} ${served === 1 ? "question" : "questions"} · ${topicOf(trimmed, questions) ?? session.title}`,
      reason: pending.evidence,
      minutes: trimmed.estimatedMinutes,
      session: trimmed,
    };
  }

  const worst = mostCostlySkill(attempts, questions);
  if (worst) {
    return {
      headline: `${served} ${served === 1 ? "question" : "questions"} on ${worst.skill.toLowerCase()}`,
      reason: `${worst.misses} of your recent misses were ${worst.skill} questions — more than any other skill.`,
      minutes: trimmed.estimatedMinutes,
      session: trimmed,
    };
  }

  return {
    headline: `${served} ${served === 1 ? "question" : "questions"} · ${topicOf(trimmed, questions) ?? session.title}`,
    reason: "This is the first block of your current route.",
    minutes: trimmed.estimatedMinutes,
    session: trimmed,
  };
}

/** The dominant skill among a block's questions, for naming it to the student. */
function topicOf(
  session: TrainingSession,
  questions: Map<string, Question>
): string | null {
  const tally = new Map<string, number>();
  for (const id of session.questionIds) {
    const question = questions.get(id);
    if (!question) continue;
    tally.set(question.skill, (tally.get(question.skill) ?? 0) + 1);
  }
  return [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function mostCostlySkill(
  attempts: Attempt[],
  questions: Map<string, Question>
): { skill: string; misses: number } | null {
  const tally = new Map<string, number>();
  for (const attempt of attempts) {
    if (attempt.correct) continue;
    const question = questions.get(attempt.questionId);
    if (!question) continue;
    tally.set(question.skill, (tally.get(question.skill) ?? 0) + 1);
  }
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? { skill: top[0], misses: top[1] } : null;
}
