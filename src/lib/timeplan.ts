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

  if (remaining.length === 0) {
    return { blocks: [], totalMinutes: 0, oneThing: null };
  }

  // Under ten minutes there is time for one focused thing, not a plan.
  if (budget <= 5) {
    return {
      blocks: [],
      totalMinutes: 0,
      oneThing: buildOneThing(remaining[0], decisions, attempts, questions, 2),
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
      blocks.push(trim(session, count));
      used += count * MINUTES_PER_QUESTION;
    }
    break;
  }

  if (blocks.length === 0) {
    return {
      blocks: [],
      totalMinutes: 0,
      oneThing: buildOneThing(remaining[0], decisions, attempts, questions, 2),
    };
  }

  return { blocks, totalMinutes: used, oneThing: null };
}

/**
 * A shorter version of a block.
 *
 * A trimmed block gets its own id so finishing it does not mark the full block
 * complete — the student who squeezed in two questions on the bus should still
 * find the whole session waiting when they have twenty minutes. The answers
 * count either way, since Beacon grades attempts rather than completions.
 */
function trim(session: TrainingSession, count: number): TrainingSession {
  const wanted = Math.max(1, count);
  if (wanted >= session.questionIds.length) return session;

  const questionIds = session.questionIds.slice(0, wanted);
  return {
    ...session,
    id: `${session.id}-part`,
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
  count: number
): OneThing {
  const trimmed = trim(session, count);
  const pending = decisions.find((d) => d.outcome === "pending");

  if (pending) {
    return {
      headline: `${count} questions on ${pending.focus.toLowerCase()}`,
      reason: pending.evidence,
      minutes: trimmed.estimatedMinutes,
      session: trimmed,
    };
  }

  const worst = mostCostlySkill(attempts, questions);
  if (worst) {
    return {
      headline: `${count} questions on ${worst.skill.toLowerCase()}`,
      reason: `${worst.misses} of your recent misses were ${worst.skill} questions — more than any other skill.`,
      minutes: trimmed.estimatedMinutes,
      session: trimmed,
    };
  }

  return {
    headline: `${count} questions from ${session.title}`,
    reason: "This is the first block of your current route.",
    minutes: trimmed.estimatedMinutes,
    session: trimmed,
  };
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
