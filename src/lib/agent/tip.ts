import { DEFAULT_PREFERENCES } from "../profile";
import type { CoachingPreferences, MistakeReason, Question } from "../types";

/**
 * Composes the note a student would write to their future self.
 *
 * Deliberately a template, not a model call: this runs the instant a question
 * is marked wrong, while offline, with no API key. The student sees it
 * pre-filled and can keep it, rewrite it, or clear it — the point is that the
 * blank box is never the reason the log stays empty.
 *
 * Coaching preferences shape it rather than decorate it: `length` decides how
 * many parts are included at all, `style` rewrites the instruction's voice,
 * and `format` decides how the parts are laid out.
 */
export function suggestTip(
  question: Question,
  reason: MistakeReason | null,
  preferences: CoachingPreferences = DEFAULT_PREFERENCES
): string {
  const skill = question.skill.toLowerCase();
  const { action, because, nextTime } = coreFor(reason, skill);
  const evidence = firstSentence(question.explanation);

  // The instruction is the only part the style rewrites; the rest are
  // supporting statements and stay statements whatever the format.
  const lead = styled(action, because, preferences.style, preferences.format);

  const rest: string[] = [];
  if (preferences.length !== "concise" && evidence) rest.push(evidence);
  if (preferences.length === "detailed") rest.push(nextTime);

  return formatted(lead, rest, preferences.format);
}

/** The substance: what to do, why it helps, and the cue for next time. */
function coreFor(
  reason: MistakeReason | null,
  skill: string
): { action: string; because: string; nextTime: string } {
  switch (reason) {
    case "concept":
      return {
        action: `review ${skill} before the next set`,
        because: "this was a gap in the rule, not a slip",
        nextTime: `Next time, write the rule at the top of the page before you start a ${skill} question.`,
      };
    case "misread":
      return {
        action: "re-read the last line of the question before looking at the choices",
        because: "the question asked for something narrower than you answered",
        nextTime:
          "Next time, underline what the question is actually asking for before you read the options.",
      };
    case "rushed":
      return {
        action: `slow down on ${skill}`,
        because: "getting it wrong quickly costs more than getting it right slowly",
        nextTime:
          "Next time, give yourself one extra pass before committing to an answer.",
      };
    case "overthought":
      return {
        action: `trust the plain reading on ${skill}`,
        because: "the simple answer is usually the tested one",
        nextTime:
          "Next time, if you have talked yourself out of an answer twice, go back to your first one.",
      };
    case "wrong-strategy":
      return {
        action: `name your approach before solving a ${skill} question`,
        because: "picking the method first stops you improvising halfway",
        nextTime:
          "Next time, say the method out loud before touching the numbers.",
      };
    case "careless":
      return {
        action: "check your own work, not the question, before submitting",
        because: "you knew this one — it slipped on the way out",
        nextTime:
          "Next time, re-read your final line before you move on. That is where this one went.",
      };
    default:
      return {
        action: `look again at how ${skill} questions are built`,
        because: "the pattern repeats more than the content does",
        nextTime: `Next time, notice what the ${skill} question is testing before you answer it.`,
      };
  }
}

function styled(
  action: string,
  because: string,
  style: CoachingPreferences["style"],
  format: CoachingPreferences["format"]
): string {
  // The questions format already asks; adding a style flourish on top of it
  // produces sentences no coach would say.
  if (format === "questions" || style === "socratic") return asQuestion(action);

  switch (style) {
    case "encouraging":
      return `You're closer than this looks — ${action}.`;
    case "direct":
      return `${capitalise(action)}.`;
    case "constructive":
      return `${capitalise(action)} — ${because}.`;
  }
}

function formatted(
  lead: string,
  rest: string[],
  format: CoachingPreferences["format"]
): string {
  const parts = [lead, ...rest].map((p) => p.trim()).filter(Boolean);
  switch (format) {
    case "bullets":
      return parts.map((p) => `• ${p}`).join("\n");
    case "steps":
      return parts.map((p, i) => `${i + 1}. ${p}`).join("\n");
    case "questions":
    case "notes":
      return parts.join(format === "notes" ? " " : "\n");
  }
}

/** Turns an instruction into the question a coach would ask instead. */
function asQuestion(action: string): string {
  const body = stripTrailingStop(action);
  return `What would change if you ${body.charAt(0).toLowerCase()}${body.slice(1)}?`;
}

function stripTrailingStop(text: string): string {
  return text.replace(/[.?!]+$/, "");
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Keeps a suggestion to one line so it reads as a reminder, not a lecture. */
function firstSentence(text: string): string {
  const trimmed = text.trim();
  const end = trimmed.search(/[.!?](\s|$)/);
  if (end === -1) return trimmed;
  return trimmed.slice(0, end + 1);
}
