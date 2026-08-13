import type { Question } from "./types";

/**
 * The three subjects a student actually thinks in.
 *
 * The test's own taxonomy splits into two sections and eight content domains,
 * which is the right unit for the coaching engine and the wrong one for a
 * student choosing what to practise tonight. This maps domains onto the three
 * labels they already use.
 */
export type Subject = "math" | "reading" | "writing";

export const SUBJECTS: Subject[] = ["math", "reading", "writing"];

const DOMAIN_SUBJECT: Record<string, Subject> = {
  Algebra: "math",
  "Advanced Math": "math",
  "Problem-Solving and Data Analysis": "math",
  "Geometry and Trigonometry": "math",
  "Information and Ideas": "reading",
  "Craft and Structure": "reading",
  "Expression of Ideas": "writing",
  "Standard English Conventions": "writing",
};

export const SUBJECT_META: Record<
  Subject,
  { label: string; blurb: string; accent: string }
> = {
  math: {
    label: "Math",
    blurb: "Algebra, functions, data, geometry",
    accent: "var(--amber)",
  },
  reading: {
    label: "Reading",
    blurb: "Main ideas, evidence, inference",
    accent: "var(--seafoam)",
  },
  writing: {
    label: "Writing",
    blurb: "Grammar, transitions, word choice",
    accent: "var(--amber-strong)",
  },
};

/** Falls back to math so an unmapped domain is still practisable. */
export function subjectOf(domain: string): Subject {
  return DOMAIN_SUBJECT[domain] ?? "math";
}

export function subjectOfQuestion(question: Question): Subject {
  return subjectOf(question.domain);
}

export function questionsForSubject(
  questions: Question[],
  subject: Subject
): Question[] {
  return questions.filter((q) => subjectOf(q.domain) === subject);
}
