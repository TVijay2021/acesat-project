import type { MistakeReason, Question } from "../types";

/**
 * Suggests the note a student would write to their future self.
 *
 * Deliberately a template, not a model call: this runs the instant a question
 * is marked wrong, while offline, with no API key. The student sees it
 * pre-filled and can keep it, rewrite it, or clear it — the point is that the
 * blank box is never the reason the log stays empty.
 */
export function suggestTip(
  question: Question,
  reason: MistakeReason | null
): string {
  const skill = question.skill.toLowerCase();

  switch (reason) {
    case "concept":
      return `Review ${skill} before the next set — this was a gap in the rule, not a slip.`;
    case "misread":
      return `Re-read the last line of the question before looking at the choices. ${firstSentence(question.explanation)}`;
    case "rushed":
      return `Slow down on ${skill}. Getting it wrong fast costs more than answering it right slowly.`;
    case "overthought":
      return `Trust the plain reading on ${skill}. ${firstSentence(question.explanation)}`;
    case "wrong-strategy":
      return `Name the approach before solving a ${skill} question. ${firstSentence(question.explanation)}`;
    case "careless":
      return `Check your own work, not the question, before submitting. ${firstSentence(question.explanation)}`;
    default:
      return firstSentence(question.explanation);
  }
}

/** Keeps the suggestion to one line so it reads as a reminder, not a lecture. */
function firstSentence(text: string): string {
  const trimmed = text.trim();
  const end = trimmed.search(/[.!?](\s|$)/);
  if (end === -1) return trimmed;
  return trimmed.slice(0, end + 1);
}
