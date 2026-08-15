import type { Attempt, Decision, MistakeReason, Question } from "../types";
import { analyseCalibration } from "./calibration";

/**
 * One line worth keeping in sight.
 *
 * Derived on every read rather than stored: the card is only worth carrying if
 * it reflects what Beacon currently knows, and a frozen card quietly becomes
 * advice for a student who no longer exists.
 *
 * The source is ranked by how much evidence stands behind it — a lesson from a
 * prediction Beacon actually got right outranks a pattern it has merely
 * noticed, which outranks the student's own most common self-diagnosis.
 */

export type CardSource = "confirmed-decision" | "calibration" | "mistake-pattern";

export interface Card {
  headline: string;
  body: string;
  /** The evidence line, shown small — the card has to be earned. */
  because: string;
  source: CardSource;
}

const REASON_CARD: Record<MistakeReason, { headline: string; body: string }> = {
  rushed: {
    headline: "Read it twice, answer once",
    body: "Your mistakes come from moving before you've finished reading. The seconds you save are costing you the mark.",
  },
  misread: {
    headline: "Answer the question asked",
    body: "Before you choose, say what the question actually wants in your own words. Most of your misses answer a different question.",
  },
  concept: {
    headline: "Name the rule first",
    body: "When you can't name the rule being tested, you're guessing with extra steps. Find the rule, then find the answer.",
  },
  overthought: {
    headline: "Your first read is usually right",
    body: "You talk yourself out of correct answers. If nothing in the text contradicts it, commit and move.",
  },
  "wrong-strategy": {
    headline: "Pick the approach before you start",
    body: "Decide how you're solving it in the first ten seconds. Changing method halfway is where your time goes.",
  },
  careless: {
    headline: "The last step is a step",
    body: "You know how to do these. Check the final line before you commit — that's where the marks are leaking.",
  },
};

export function buildCard(
  decisions: Decision[],
  attempts: Attempt[],
  questions: Map<string, Question>
): Card | null {
  // 1. A lesson from a prediction that actually held. Strongest evidence there
  //    is: Beacon claimed this would work for this student, and it did.
  const confirmed = decisions
    .filter((d) => d.outcome === "confirmed")
    .sort((a, b) => (b.gradedAt ?? 0) - (a.gradedAt ?? 0))[0];

  if (confirmed) {
    const card = cardForFocus(confirmed.focus);
    if (card) {
      return {
        ...card,
        because: `Beacon predicted this would work for you, and it did — ${confirmed.outcomeNote ?? "the prediction held"}`,
        source: "confirmed-decision",
      };
    }
  }

  // 2. A miscalibration Beacon can see but the student cannot.
  const calibration = analyseCalibration(attempts, questions);
  if (calibration.verdict === "overconfident" && calibration.weakestArea) {
    return {
      headline: "Certainty is not evidence",
      body: `When ${calibration.weakestArea.domain} feels obvious, that is exactly when to check the option you dismissed first.`,
      because: `You marked "Sure" on ${calibration.bands[0].count} questions and missed ${calibration.falseConfidence}`,
      source: "calibration",
    };
  }
  if (calibration.verdict === "underconfident") {
    return {
      headline: "Trust the first read",
      body: "You are getting these right while telling yourself you are guessing. Commit sooner and bank the time.",
      because: `You marked "Unsure" or "Guess" on questions you then got right`,
      source: "calibration",
    };
  }

  // 3. The student's own most common self-diagnosis, from the reflection step.
  const common = mostCommonReason(attempts);
  if (common) {
    return {
      ...REASON_CARD[common.reason],
      because: `You logged "${common.reason.replace("-", " ")}" on ${common.count} of your recent misses`,
      source: "mistake-pattern",
    };
  }

  // Nothing earned yet. An unearned card is just a poster.
  return null;
}

function cardForFocus(focus: string): { headline: string; body: string } | null {
  const lower = focus.toLowerCase();
  if (lower.includes("timing") || lower.includes("pacing")) {
    return {
      headline: "Mark it and move",
      body: "When a question takes too long, leave it and come back. Your time is part of your score.",
    };
  }
  if (lower.includes("evidence") || lower.includes("reading")) {
    return {
      headline: "Point at the sentence",
      body: "Before you answer, find the exact line that proves it. If you can't point at it, it isn't the answer.",
    };
  }
  if (lower.includes("grammar") || lower.includes("convention")) {
    return {
      headline: "Read it aloud in your head",
      body: "Most convention questions resolve the moment you hear the sentence rather than scan it.",
    };
  }
  if (lower.includes("checking") || lower.includes("committing")) {
    return {
      headline: "Certainty is not evidence",
      body: "The answers that feel obvious are the ones costing you marks. Check the one you eliminated fastest.",
    };
  }
  return null;
}

function mostCommonReason(
  attempts: Attempt[]
): { reason: MistakeReason; count: number } | null {
  const tally = new Map<MistakeReason, number>();
  for (const attempt of attempts) {
    if (!attempt.mistakeReason) continue;
    tally.set(
      attempt.mistakeReason,
      (tally.get(attempt.mistakeReason) ?? 0) + 1
    );
  }
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
  // Two of the same reason is a coincidence, not a pattern.
  return top && top[1] >= 3 ? { reason: top[0], count: top[1] } : null;
}
