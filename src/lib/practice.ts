import type { Attempt, Question, TrainingSession } from "./types";
import { questionsForSubject, SUBJECT_META, type Subject } from "./subjects";

/**
 * Builds a practice block for a subject the student picked themselves.
 *
 * This is not part of a packed route, so it is never written to the database
 * and never marked complete — it exists so "I want to do some reading tonight"
 * is one tap, without waiting for Beacon to decide that reading is the
 * priority. The attempts it produces are recorded like any other, so they
 * still feed the next check-in.
 */
export function buildPracticeSession(
  subject: Subject,
  questions: Question[],
  attempts: Attempt[],
  count = 4
): TrainingSession | null {
  const pool = questionsForSubject(questions, subject);
  if (pool.length === 0) return null;

  const seen = new Set(attempts.map((a) => a.questionId));
  const unseen = pool.filter((q) => !seen.has(q.id));
  const rest = pool.filter((q) => seen.has(q.id));

  // Prefer material the student hasn't met; fall back to repeats, which are
  // still useful — a second look at a missed question is the point.
  const ranked = [...unseen, ...rest].slice(0, count);

  return {
    id: `practice-${subject}-${Date.now()}`,
    routeId: "practice",
    title: `${SUBJECT_META[subject].label} practice`,
    kind: subject === "math" ? "timing" : subject === "reading" ? "reading" : "grammar",
    intent: SUBJECT_META[subject].blurb,
    estimatedMinutes: Math.max(4, Math.round(ranked.length * 1.5)),
    questionIds: ranked.map((q) => q.id),
    completedAt: null,
    day: 0,
  };
}
