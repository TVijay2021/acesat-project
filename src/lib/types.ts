export type Section = "reading-writing" | "math";

export type QuestionFormat = "multiple-choice" | "grid-in";

export interface Choice {
  label: string;
  text: string;
}

export interface Question {
  id: string;
  section: Section;
  number: number;
  domain: string;
  skill: string;
  stem: string;
  choices: Choice[];
  format: QuestionFormat;
  answer: string;
  explanation: string;
  distractorExplanation: string | null;
}

/** Why a student got a question wrong, captured in the reflection ritual. */
export type MistakeReason =
  | "concept"
  | "misread"
  | "rushed"
  | "overthought"
  | "wrong-strategy"
  | "careless";

export type Confidence = "sure" | "unsure" | "guess";

/** One answered question. The raw signal everything else is derived from. */
export interface Attempt {
  id?: number;
  questionId: string;
  sessionId: string;
  /** Chosen label for multiple choice, typed value for grid-in. */
  response: string;
  correct: boolean;
  /** Milliseconds from question render to submit. */
  elapsedMs: number;
  confidence: Confidence;
  mistakeReason: MistakeReason | null;
  answeredAt: number;
  /** False until a sync has folded this attempt into a decision outcome. */
  synced: boolean;
}

export type TrainingKind = "timing" | "grammar" | "reading" | "strategy";

/** A single offline training block inside a route. */
export interface TrainingSession {
  id: string;
  routeId: string;
  title: string;
  kind: TrainingKind;
  /** Human-facing goal, e.g. "Improve skip-and-return decisions." */
  intent: string;
  estimatedMinutes: number;
  questionIds: string[];
  completedAt: number | null;
  /** Day index within the route, 0-based. */
  day: number;
}

/** The packed offline plan. Beacon prepares one per sync. */
export interface Route {
  id: string;
  createdAt: number;
  primaryFocus: string;
  secondaryFocus: string;
  /** Student-facing sentence explaining the choice. */
  rationale: string;
  days: number;
  decisionId: string;
}

export type DecisionOutcome = "confirmed" | "missed" | "pending";

/**
 * The Decision Ledger entry. This is the product: Beacon records what it chose,
 * why, what it expected, and later grades its own prediction.
 */
export interface Decision {
  id: string;
  createdAt: number;
  focus: string;
  /** Observed facts that drove the choice, phrased for the student. */
  evidence: string;
  /** What Beacon did about it. */
  action: string;
  /** What Beacon expected to happen, checked on the next sync. */
  prediction: string;
  /** The measurable claim behind the prediction, checked in code. */
  predictionCheck: PredictionCheck;
  outcome: DecisionOutcome;
  /** Filled in on the sync that grades this decision. */
  outcomeNote: string | null;
  gradedAt: number | null;
  /** True when the explanation text came from Claude rather than a template. */
  authored: boolean;
}

/**
 * A falsifiable claim attached to a decision. Recorded at decision time and
 * evaluated against later attempts, so the ledger can be graded without an LLM.
 */
export interface PredictionCheck {
  metric: "medianTimeMs" | "accuracy";
  /** Attempts are filtered to this focus area before measuring. */
  scope: { domain?: string; section?: Section };
  direction: "decrease" | "increase" | "hold";
  /** Baseline measured when the decision was made. */
  baseline: number;
  /** Minimum change required to count as confirmed, as a ratio (0.1 = 10%). */
  threshold: number;
  /** Accuracy must not fall below this while timing improves. */
  guardAccuracy?: number;
}

/** A short coaching card the student can keep. */
export interface MemoryCard {
  id: string;
  createdAt: number;
  headline: string;
  body: string;
  decisionId: string;
}
