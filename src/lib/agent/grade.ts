import type { Attempt, Decision, Question } from "../types";
import { measure, percent, scoped, seconds, since } from "./analyze";

export interface Grade {
  outcome: "confirmed" | "missed";
  note: string;
  /** What Beacon takes forward: did this kind of intervention work? */
  lesson: string;
}

/**
 * Grades a decision's prediction against the attempts that came after it.
 *
 * This runs in plain code, not in the model. The ledger's credibility depends
 * on the check being falsifiable and reproducible — an LLM asked "did your
 * prediction come true?" will tend to say yes.
 */
export function gradeDecision(
  decision: Decision,
  attempts: Attempt[],
  questions: Map<string, Question>
): Grade | null {
  const check = decision.predictionCheck;
  const after = scoped(since(attempts, decision.createdAt), questions, check.scope);

  // Not enough new evidence to judge fairly — leave it pending.
  if (after.length < 3) return null;

  const now = measure(after);

  if (check.metric === "medianTimeMs") {
    const change = (check.baseline - now.medianTimeMs) / check.baseline;
    const improved = change >= check.threshold;
    const accuracyHeld =
      check.guardAccuracy === undefined || now.accuracy >= check.guardAccuracy;
    const deltaSeconds = seconds(Math.abs(check.baseline - now.medianTimeMs));

    if (improved && accuracyHeld) {
      return {
        outcome: "confirmed",
        note: `Your pacing improved by ${deltaSeconds} seconds per question while accuracy held at ${percent(now.accuracy)}%.`,
        lesson: `${decision.focus} interventions are currently high-value for you.`,
      };
    }
    if (improved && !accuracyHeld) {
      return {
        outcome: "missed",
        note: `You got faster by ${deltaSeconds} seconds per question, but accuracy dropped to ${percent(now.accuracy)}%.`,
        lesson: `Pushing pace on ${decision.focus} costs you accuracy. Beacon will trade speed for correctness next.`,
      };
    }
    return {
      outcome: "missed",
      note: `Your pacing did not improve — median time moved by ${deltaSeconds} seconds against a target of ${percent(check.threshold)}%.`,
      lesson: `Timing drills alone are not shifting ${decision.focus}. Beacon will try a strategy review instead.`,
    };
  }

  const change = (now.accuracy - check.baseline) / Math.max(check.baseline, 0.01);
  if (change >= check.threshold) {
    return {
      outcome: "confirmed",
      note: `Your accuracy rose from ${percent(check.baseline)}% to ${percent(now.accuracy)}%.`,
      lesson: `${decision.focus} review is currently high-value for you.`,
    };
  }
  return {
    outcome: "missed",
    note: `Your accuracy moved from ${percent(check.baseline)}% to ${percent(now.accuracy)}%, short of the target.`,
    lesson: `${decision.focus} review has had limited impact recently. Beacon is changing approach.`,
  };
}
