import type { Attempt, Question, Section } from "../types";

export interface Metrics {
  count: number;
  accuracy: number;
  medianTimeMs: number;
}

export interface FocusArea {
  key: string;
  label: string;
  domain?: string;
  section?: Section;
  metrics: Metrics;
}

const EMPTY: Metrics = { count: 0, accuracy: 0, medianTimeMs: 0 };

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function measure(attempts: Attempt[]): Metrics {
  if (!attempts.length) return EMPTY;
  return {
    count: attempts.length,
    accuracy: attempts.filter((a) => a.correct).length / attempts.length,
    medianTimeMs: median(attempts.map((a) => a.elapsedMs)),
  };
}

/**
 * Restricts attempts to a focus area. An undefined field means "any", so an
 * empty scope measures everything.
 */
export function scoped(
  attempts: Attempt[],
  questions: Map<string, Question>,
  scope: { domain?: string; section?: Section }
): Attempt[] {
  return attempts.filter((attempt) => {
    const question = questions.get(attempt.questionId);
    if (!question) return false;
    if (scope.domain && question.domain !== scope.domain) return false;
    if (scope.section && question.section !== scope.section) return false;
    return true;
  });
}

/**
 * Groups attempts by domain so the agent can compare areas against each other.
 * Domains with too few attempts are dropped — a single slow question is noise,
 * not a pattern, and acting on it produces decisions the student won't trust.
 */
export function focusAreas(
  attempts: Attempt[],
  questions: Map<string, Question>,
  minAttempts = 3
): FocusArea[] {
  const byDomain = new Map<string, Attempt[]>();
  for (const attempt of attempts) {
    const question = questions.get(attempt.questionId);
    if (!question) continue;
    const bucket = byDomain.get(question.domain) ?? [];
    bucket.push(attempt);
    byDomain.set(question.domain, bucket);
  }

  return [...byDomain.entries()]
    .filter(([, group]) => group.length >= minAttempts)
    .map(([domain, group]) => ({
      key: domain,
      label: domain,
      domain,
      metrics: measure(group),
    }));
}

/** Attempts from the most recent `n` answered questions, newest last. */
export function recent(attempts: Attempt[], n: number): Attempt[] {
  return [...attempts].sort((a, b) => a.answeredAt - b.answeredAt).slice(-n);
}

/** Attempts answered before a cutoff — the comparison window for a decision. */
export function before(attempts: Attempt[], cutoff: number): Attempt[] {
  return attempts.filter((a) => a.answeredAt < cutoff);
}

/** Attempts answered after a cutoff — the evidence a prediction is graded on. */
export function since(attempts: Attempt[], cutoff: number): Attempt[] {
  return attempts.filter((a) => a.answeredAt >= cutoff);
}

export function percent(ratio: number): number {
  return Math.round(ratio * 100);
}

export function seconds(ms: number): number {
  return Math.round(ms / 1000);
}
