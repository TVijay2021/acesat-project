import type { Attempt, Confidence, Question } from "../types";
import { percent } from "./analyze";

/**
 * How well a student's sense of "I know this" matches whether they were right.
 *
 * Every answer already records a confidence rating, so this costs no new
 * question-asking. It is the one coaching signal a chatbot structurally cannot
 * give: it requires having watched the student commit to a prediction and then
 * checked it — the same shape as Beacon's own Decision Ledger, turned on the
 * student.
 */

export interface Band {
  level: Confidence;
  label: string;
  count: number;
  correct: number;
  accuracy: number;
}

export type CalibrationVerdict =
  | "overconfident"
  | "underconfident"
  | "well-calibrated"
  | "insufficient";

export interface CalibrationReport {
  bands: Band[];
  total: number;
  /** Marked "sure" and got it wrong. The expensive kind of mistake. */
  falseConfidence: number;
  /** Marked "guess" and got it right — knowledge the student doesn't credit. */
  luckyGuesses: number;
  /** Where confident answers go wrong most often. */
  weakestArea: { domain: string; sure: number; wrong: number } | null;
  verdict: CalibrationVerdict;
  headline: string;
  detail: string;
  /** What to actually do about it. */
  advice: string;
}

const LABEL: Record<Confidence, string> = {
  sure: "Sure",
  unsure: "Unsure",
  guess: "Guess",
};

const ORDER: Confidence[] = ["sure", "unsure", "guess"];

/**
 * Below this there is not enough evidence to tell a real pattern from noise,
 * and telling a student they are overconfident on four questions would be
 * exactly the kind of unearned claim the Decision Ledger exists to avoid.
 */
const MIN_ATTEMPTS = 8;
const MIN_BAND = 4;

/**
 * A confident answer should land far more often than not. Below this the
 * student's sense of certainty is not tracking their actual knowledge.
 */
const SURE_ACCURACY_FLOOR = 0.7;

/**
 * Guessing on a four-option question is right about a quarter of the time.
 * Well above that means the student knows more than they are giving themselves
 * credit for — which costs them time and nerve, not marks.
 */
const GUESS_ACCURACY_CEILING = 0.55;

export function analyseCalibration(
  attempts: Attempt[],
  questions: Map<string, Question>
): CalibrationReport {
  const bands = ORDER.map((level) => {
    const group = attempts.filter((a) => a.confidence === level);
    const correct = group.filter((a) => a.correct).length;
    return {
      level,
      label: LABEL[level],
      count: group.length,
      correct,
      accuracy: group.length ? correct / group.length : 0,
    };
  });

  const total = attempts.length;
  const sure = bands[0];
  const guess = bands[2];
  const unsure = bands[1];

  const falseConfidence = sure.count - sure.correct;
  const luckyGuesses = guess.correct;
  const weakestArea = worstConfidentArea(attempts, questions);

  if (total < MIN_ATTEMPTS || sure.count < MIN_BAND) {
    return {
      bands,
      total,
      falseConfidence,
      luckyGuesses,
      weakestArea,
      verdict: "insufficient",
      headline: "Not enough answers yet",
      detail: `Beacon needs about ${MIN_ATTEMPTS} answered questions before it can tell whether your confidence is tracking your accuracy.`,
      advice: "Keep training — this fills in on its own.",
    };
  }

  if (sure.accuracy < SURE_ACCURACY_FLOOR) {
    return {
      bands,
      total,
      falseConfidence,
      luckyGuesses,
      weakestArea,
      verdict: "overconfident",
      headline: "Your confidence is running ahead of your accuracy",
      detail: weakestArea
        ? `You marked "Sure" on ${sure.count} questions and missed ${falseConfidence} of them — ${weakestArea.wrong} in ${weakestArea.domain} alone.`
        : `You marked "Sure" on ${sure.count} questions and missed ${falseConfidence} of them.`,
      advice:
        "When an answer feels obvious, check the one you eliminated fastest before moving on. Certainty is where your marks are leaking.",
    };
  }

  // Only meaningful once the student has actually used the lower bands.
  const lowBandCount = guess.count + unsure.count;
  const lowBandCorrect = guess.correct + unsure.correct;
  const lowBandAccuracy = lowBandCount ? lowBandCorrect / lowBandCount : 0;

  if (lowBandCount >= MIN_BAND && lowBandAccuracy > GUESS_ACCURACY_CEILING) {
    return {
      bands,
      total,
      falseConfidence,
      luckyGuesses,
      weakestArea,
      verdict: "underconfident",
      headline: "You know more than you think",
      detail: `You marked "Unsure" or "Guess" on ${lowBandCount} questions and got ${lowBandCorrect} of them right — ${percent(lowBandAccuracy)}%, far above guessing.`,
      advice:
        "Trust your first read more. Second-guessing is costing you time you need at the end of the section, not marks.",
    };
  }

  // A good average can hide a bad pocket. If the confident misses cluster in
  // one domain, that is the useful thing to say — "you're reliable" on its own
  // tells a student nothing they can act on.
  const clustered =
    weakestArea && weakestArea.wrong >= 2 && falseConfidence > 0
      ? weakestArea.wrong / falseConfidence >= 0.5
      : false;

  return {
    bands,
    total,
    falseConfidence,
    luckyGuesses,
    weakestArea,
    verdict: "well-calibrated",
    headline: "Your instincts are reliable",
    detail: clustered
      ? `When you say you're sure, you're right ${percent(sure.accuracy)}% of the time — but ${weakestArea!.wrong} of your ${falseConfidence} confident misses were in ${weakestArea!.domain}. Your judgement is sound everywhere except there.`
      : `When you say you're sure, you're right ${percent(sure.accuracy)}% of the time. That means you can trust the feeling and spend your time where you're genuinely unsure.`,
    advice: clustered
      ? `Trust your first read — except on ${weakestArea!.domain}, where "obvious" has been misleading you. Slow down on those specifically.`
      : "Use it: skip anything that doesn't feel certain on the first pass, and come back with the time you saved.",
  };
}

/** The domain where confident answers go wrong most often. */
function worstConfidentArea(
  attempts: Attempt[],
  questions: Map<string, Question>
): { domain: string; sure: number; wrong: number } | null {
  const tally = new Map<string, { sure: number; wrong: number }>();

  for (const attempt of attempts) {
    if (attempt.confidence !== "sure") continue;
    const question = questions.get(attempt.questionId);
    if (!question) continue;
    const entry = tally.get(question.domain) ?? { sure: 0, wrong: 0 };
    entry.sure += 1;
    if (!attempt.correct) entry.wrong += 1;
    tally.set(question.domain, entry);
  }

  const ranked = [...tally.entries()]
    .filter(([, entry]) => entry.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong);

  if (!ranked.length) return null;
  const [domain, entry] = ranked[0];
  return { domain, ...entry };
}
