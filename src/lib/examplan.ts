import type { Attempt, StartingPoint } from "./types";

/**
 * The stage of preparation a student is in, chosen by how long is left.
 *
 * The ordering reflects how SAT prep actually pays off: accuracy has to come
 * before speed, because drilling pace on material you get wrong just makes you
 * wrong faster. Timed work belongs near the end, and the last stretch is for
 * consolidating rather than opening new ground.
 */
export type Phase = "foundations" | "drilling" | "timing" | "taper" | "past";

export interface PhaseSpec {
  id: Phase;
  label: string;
  focus: string;
  /** Inclusive lower bound in days until the test. */
  fromDays: number;
}

export const PHASES: PhaseSpec[] = [
  {
    id: "foundations",
    label: "Foundations",
    focus: "Accuracy first. Untimed sets on your weakest domains.",
    fromDays: 57,
  },
  {
    id: "drilling",
    label: "Skill drilling",
    focus: "Targeted sets on the skills costing you the most marks.",
    fromDays: 29,
  },
  {
    id: "timing",
    label: "Timing and sections",
    focus: "Timed sets and skip-and-return practice under pressure.",
    fromDays: 15,
  },
  {
    id: "taper",
    label: "Taper",
    focus: "Review your mistake log. No new material.",
    fromDays: 0,
  },
];

export interface ExamPlan {
  testDate: Date;
  daysLeft: number;
  weeksLeft: number;
  phase: PhaseSpec;
  /** Days until the next phase begins; null in the final phase. */
  daysToNextPhase: number | null;
  nextPhase: PhaseSpec | null;
  /** Target minus current total, when both are known. */
  pointsNeeded: number | null;
  /** Sessions per week to close the gap in the time left. */
  sessionsPerWeek: number;
  /** Sessions completed in the last seven days. */
  sessionsThisWeek: number;
  onPace: boolean;
  /** Plain-language read on whether the target is realistic. */
  verdict: string;
}

/**
 * Roughly how many points a focused practice session is worth.
 *
 * Published SAT prep research puts ~10 hours of practice at ~30 points, so a
 * ~15 minute session lands near 1.5 points. This is a planning heuristic, not a
 * promise, and the UI says so — a student who is told "6 sessions a week" and
 * then misses their target deserves to know where the number came from.
 */
const POINTS_PER_SESSION = 1.5;

/** Beyond this the schedule stops being something a student can sustain. */
const MAX_SESSIONS_PER_WEEK = 12;
const MIN_SESSIONS_PER_WEEK = 3;

export function daysUntil(isoDate: string, now = new Date()): number {
  const test = new Date(`${isoDate}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((test.getTime() - today.getTime()) / 86_400_000);
}

export function phaseFor(daysLeft: number): PhaseSpec {
  if (daysLeft < 0) {
    return {
      id: "past",
      label: "Test day has passed",
      focus: "Set a new test date to get a fresh plan.",
      fromDays: 0,
    };
  }
  return (
    PHASES.find((phase) => daysLeft >= phase.fromDays) ?? PHASES[PHASES.length - 1]
  );
}

/**
 * Builds a study path toward a test date.
 *
 * Returns null when there is no date to plan against — the caller shows the
 * "add your test date" prompt rather than inventing a schedule.
 */
export function buildExamPlan(
  startingPoint: StartingPoint | null,
  attempts: Attempt[],
  now = new Date()
): ExamPlan | null {
  if (!startingPoint?.testDate) return null;

  const daysLeft = daysUntil(startingPoint.testDate, now);
  const phase = phaseFor(daysLeft);
  const weeksLeft = Math.max(daysLeft / 7, 0);

  const pointsNeeded =
    startingPoint.targetScore !== null && startingPoint.total !== null
      ? startingPoint.targetScore - startingPoint.total
      : null;

  const sessionsPerWeek = requiredSessionsPerWeek(pointsNeeded, weeksLeft);
  const sessionsThisWeek = countRecentSessions(attempts, now);

  const nextIndex = PHASES.findIndex((p) => p.id === phase.id) + 1;
  const nextPhase =
    phase.id === "past" || nextIndex >= PHASES.length ? null : PHASES[nextIndex];

  return {
    testDate: new Date(`${startingPoint.testDate}T00:00:00`),
    daysLeft,
    weeksLeft: Math.ceil(weeksLeft),
    phase,
    nextPhase,
    daysToNextPhase: nextPhase ? daysLeft - nextPhase.fromDays : null,
    pointsNeeded,
    sessionsPerWeek,
    sessionsThisWeek,
    onPace: sessionsThisWeek >= sessionsPerWeek,
    verdict: verdictFor(pointsNeeded, weeksLeft, sessionsPerWeek, daysLeft),
  };
}

function requiredSessionsPerWeek(
  pointsNeeded: number | null,
  weeksLeft: number
): number {
  if (pointsNeeded === null || pointsNeeded <= 0 || weeksLeft <= 0) {
    return MIN_SESSIONS_PER_WEEK;
  }
  const sessions = pointsNeeded / POINTS_PER_SESSION / weeksLeft;
  return Math.min(
    MAX_SESSIONS_PER_WEEK,
    Math.max(MIN_SESSIONS_PER_WEEK, Math.ceil(sessions))
  );
}

/** Sessions the student has actually run in the past seven days. */
function countRecentSessions(attempts: Attempt[], now: Date): number {
  const cutoff = now.getTime() - 7 * 86_400_000;
  const sessions = new Set(
    attempts.filter((a) => a.answeredAt >= cutoff).map((a) => a.sessionId)
  );
  return sessions.size;
}

/**
 * An honest read on the target.
 *
 * Beacon says plainly when a goal needs more weeks than are left, rather than
 * printing an encouraging number the student cannot act on.
 */
function verdictFor(
  pointsNeeded: number | null,
  weeksLeft: number,
  sessionsPerWeek: number,
  daysLeft: number
): string {
  if (daysLeft < 0) return "That test date has passed. Set a new one to replan.";
  if (daysLeft === 0) return "Test day. Rest — no new material tonight.";
  if (pointsNeeded === null) {
    return "Add your current and target score and Beacon will pace the plan for you.";
  }
  if (pointsNeeded <= 0) {
    return "You're already at your target. Beacon will work on holding it steady.";
  }
  if (sessionsPerWeek >= MAX_SESSIONS_PER_WEEK) {
    const reachable = Math.round(
      MAX_SESSIONS_PER_WEEK * POINTS_PER_SESSION * weeksLeft
    );
    return `${pointsNeeded} points in ${Math.ceil(weeksLeft)} weeks is a stretch. At a sustainable pace you're on track for about ${reachable}. A later test date would make the target realistic.`;
  }
  // Sessions per week is what Beacon tracks, but it is a poor unit for judging
  // whether a plan is livable — eleven sessions sounds punishing until you know
  // each one is about ten minutes. Give the daily time cost alongside it.
  const minutesPerDay = Math.round((sessionsPerWeek * TYPICAL_SESSION_MINUTES) / 7);
  return `${pointsNeeded} points in ${Math.ceil(weeksLeft)} weeks works out to ${sessionsPerWeek} sessions a week — about ${minutesPerDay} minutes a day.`;
}

/** Used only to express a weekly session count as a daily time commitment. */
const TYPICAL_SESSION_MINUTES = 10;

/** Milestones between now and test day, for the plan timeline. */
export function milestones(plan: ExamPlan): {
  spec: PhaseSpec;
  state: "done" | "current" | "upcoming";
  startsInDays: number;
}[] {
  return PHASES.map((spec) => {
    const state =
      spec.id === plan.phase.id
        ? "current"
        : plan.daysLeft < spec.fromDays
          ? "done"
          : "upcoming";
    return { spec, state, startsInDays: Math.max(plan.daysLeft - spec.fromDays, 0) };
  });
}
