import type { Attempt, Decision, Question, TrainingKind } from "../types";
import { analyseCalibration } from "./calibration";
import {
  type FocusArea,
  focusAreas,
  measure,
  percent,
  scoped,
  seconds,
} from "./analyze";

export interface Diagnosis {
  area: FocusArea;
  kind: TrainingKind;
  /** Machine-readable reason, rendered into prose by the copy layer. */
  signal:
    | "slow-but-accurate"
    | "inaccurate"
    | "rushed-and-wrong"
    | "overconfident"
    | "steady";
  /** Median time across all areas, for phrasing the comparison. */
  overallMedianMs: number;
  overallAccuracy: number;
  /** Accuracy across answers rated "Sure", when miscalibration was diagnosed. */
  sureAccuracy?: number;
}

/** How often each intervention kind has been confirmed vs missed. */
export type Calibration = Record<TrainingKind, { confirmed: number; missed: number }>;

const EMPTY_CALIBRATION: Calibration = {
  timing: { confirmed: 0, missed: 0 },
  grammar: { confirmed: 0, missed: 0 },
  reading: { confirmed: 0, missed: 0 },
  strategy: { confirmed: 0, missed: 0 },
};

/**
 * Summarises which interventions have actually worked for this student. This is
 * the "Beacon is learning your patterns" surface, and it feeds back into the
 * next choice — a kind that keeps missing gets demoted.
 */
export function calibrate(decisions: Decision[]): Calibration {
  const calibration: Calibration = structuredClone(EMPTY_CALIBRATION);
  for (const decision of decisions) {
    const kind = kindForFocus(decision.focus);
    if (decision.outcome === "confirmed") calibration[kind].confirmed += 1;
    if (decision.outcome === "missed") calibration[kind].missed += 1;
  }
  return calibration;
}

function kindForFocus(focus: string): TrainingKind {
  const lower = focus.toLowerCase();
  if (lower.includes("timing") || lower.includes("pacing")) return "timing";
  if (lower.includes("grammar") || lower.includes("convention")) return "grammar";
  if (lower.includes("reading") || lower.includes("evidence")) return "reading";
  return "strategy";
}

/** Net track record for a kind: positive means it has been working. */
function trackRecord(calibration: Calibration, kind: TrainingKind): number {
  const { confirmed, missed } = calibration[kind];
  return confirmed - missed;
}

/**
 * Picks what Beacon should work on next.
 *
 * The ranking is deliberately simple and inspectable: accuracy problems
 * outrank pacing problems, pacing problems outrank everything else, and an
 * intervention kind that has repeatedly missed is penalised so Beacon stops
 * prescribing something that demonstrably is not helping.
 */
export function diagnose(
  attempts: Attempt[],
  questions: Map<string, Question>,
  decisions: Decision[] = []
): Diagnosis | null {
  const areas = focusAreas(attempts, questions);
  if (!areas.length) return null;

  const overall = measure(attempts);
  const calibration = calibrate(decisions);

  const scored = areas.map((area) => {
    const { accuracy, medianTimeMs } = area.metrics;
    const slower = medianTimeMs / Math.max(overall.medianTimeMs, 1);

    let signal: Diagnosis["signal"] = "steady";
    let kind: TrainingKind = "strategy";
    let weight = 0;

    if (accuracy < 0.6) {
      signal = "inaccurate";
      kind = kindForArea(area);
      weight = (0.6 - accuracy) * 100;
    } else if (slower > 1.15) {
      // Understands the material but burns clock: the classic timing case.
      signal = "slow-but-accurate";
      kind = "timing";
      weight = (slower - 1) * 60;
    } else if (accuracy < 0.75 && slower < 0.85) {
      // Fast and wrong — rushing, not a knowledge gap.
      signal = "rushed-and-wrong";
      kind = "strategy";
      weight = (0.75 - accuracy) * 80;
    }

    // Demote interventions this student has not responded to.
    weight += trackRecord(calibration, kind) * 5;

    return { area, kind, signal, weight };
  });

  // Miscalibration outranks the domain ranking when it is clear.
  //
  // A student who is wrong on questions they were *certain* about will not be
  // helped by more practice in that domain — they will make the same call
  // faster. The intervention has to target the judgement, not the content, so
  // this is checked before the accuracy and pacing signals rather than
  // competing with them on weight.
  const selfRating = analyseCalibration(attempts, questions);
  if (selfRating.verdict === "overconfident" && selfRating.weakestArea) {
    const area =
      areas.find((a) => a.domain === selfRating.weakestArea!.domain) ?? areas[0];
    return {
      area,
      kind: "strategy",
      signal: "overconfident",
      overallMedianMs: overall.medianTimeMs,
      overallAccuracy: overall.accuracy,
      sureAccuracy: selfRating.bands[0].accuracy,
    };
  }

  const best = scored
    .filter((s) => s.signal !== "steady")
    .sort((a, b) => b.weight - a.weight)[0];

  if (!best) return null;

  return {
    area: best.area,
    kind: best.kind,
    signal: best.signal,
    overallMedianMs: overall.medianTimeMs,
    overallAccuracy: overall.accuracy,
  };
}

function kindForArea(area: FocusArea): TrainingKind {
  const domain = area.domain ?? "";
  if (domain.includes("Conventions")) return "grammar";
  if (domain.includes("Ideas") || domain.includes("Craft")) return "reading";
  return "strategy";
}

/**
 * Turns a diagnosis into the falsifiable claim the next sync will grade.
 * Every decision must carry one — a prediction Beacon cannot check is just a
 * recommendation.
 */
export function buildPredictionCheck(
  diagnosis: Diagnosis
): Decision["predictionCheck"] {
  const scope = { domain: diagnosis.area.domain };
  if (diagnosis.signal === "slow-but-accurate") {
    return {
      metric: "medianTimeMs",
      scope,
      direction: "decrease",
      baseline: diagnosis.area.metrics.medianTimeMs,
      threshold: 0.12,
      // Speed that costs accuracy is not an improvement.
      guardAccuracy: Math.max(diagnosis.area.metrics.accuracy - 0.05, 0),
    };
  }
  if (diagnosis.signal === "overconfident") {
    // Measured only over answers the student rated "Sure" — the whole claim is
    // about that band, so grading it against every attempt would let unrelated
    // progress confirm a prediction Beacon never actually made.
    return {
      metric: "accuracy",
      scope: { ...scope, confidence: "sure" },
      direction: "increase",
      baseline: diagnosis.sureAccuracy ?? diagnosis.area.metrics.accuracy,
      threshold: 0.15,
    };
  }

  return {
    metric: "accuracy",
    scope,
    direction: "increase",
    baseline: diagnosis.area.metrics.accuracy,
    threshold: 0.15,
  };
}

/** Deterministic student-facing copy. Claude rewrites this when a key is set. */
export function describe(diagnosis: Diagnosis) {
  const { area, overallMedianMs } = diagnosis;
  const areaSeconds = seconds(area.metrics.medianTimeMs);
  const overallSeconds = seconds(overallMedianMs);
  const accuracy = percent(area.metrics.accuracy);

  switch (diagnosis.signal) {
    case "slow-but-accurate": {
      const gap = Math.round(
        ((area.metrics.medianTimeMs - overallMedianMs) / overallMedianMs) * 100
      );
      return {
        focus: "Timing under pressure",
        evidence: `You are answering ${area.label} questions at ${accuracy}% accuracy, but spending ${gap}% longer than your average — ${areaSeconds}s against ${overallSeconds}s.`,
        action: "Assigned three skip-and-return drills.",
        prediction:
          "Your pacing will improve without reducing accuracy.",
      };
    }
    case "rushed-and-wrong":
      return {
        focus: "Slowing down to read",
        evidence: `You are moving fast on ${area.label} — ${areaSeconds}s per question against a ${overallSeconds}s average — but only ${accuracy}% are landing.`,
        action: "Assigned a set with a forced re-read step before answering.",
        prediction: "Your accuracy will rise as your pace settles.",
      };
    case "overconfident":
      return {
        focus: "Checking before committing",
        evidence: `You have been marking answers "Sure" and getting them wrong — most often in ${area.label}. The marks are going on questions you were not double-checking.`,
        action: "Assigned a set with a forced elimination check before each answer.",
        prediction:
          "Your accuracy on questions you mark Sure will rise as you slow down on the ones that feel obvious.",
      };
    case "inaccurate":
      return {
        focus: `${area.label} fundamentals`,
        evidence: `${accuracy}% of your recent ${area.label} questions were correct, below where the rest of your work sits.`,
        action: "Assigned a focused review set with worked explanations.",
        prediction: "Your accuracy in this area will rise.",
      };
    default:
      return {
        focus: area.label,
        evidence: `Your ${area.label} work is steady at ${accuracy}%.`,
        action: "Assigned a mixed maintenance set.",
        prediction: "Your accuracy will hold.",
      };
  }
}

/** Picks questions for a training block, preferring the diagnosed area. */
export function selectQuestions(
  diagnosis: Diagnosis,
  questions: Question[],
  attempts: Attempt[],
  count: number
): string[] {
  const seen = new Set(attempts.map((a) => a.questionId));
  const inFocus = questions.filter((q) => q.domain === diagnosis.area.domain);
  const rest = questions.filter((q) => q.domain !== diagnosis.area.domain);

  // Unseen questions first, then previously seen ones — with 33 questions in
  // the bank, repeats are expected and are useful for measuring change.
  const ranked = [
    ...inFocus.filter((q) => !seen.has(q.id)),
    ...rest.filter((q) => !seen.has(q.id)),
    ...inFocus.filter((q) => seen.has(q.id)),
    ...rest.filter((q) => seen.has(q.id)),
  ];

  return ranked.slice(0, count).map((q) => q.id);
}

export { scoped };
