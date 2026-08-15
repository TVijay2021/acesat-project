import type { Section } from "../types";

/**
 * The shape of the digital SAT, as College Board publishes it.
 *
 * Reading and Writing is 64 minutes over two 32-minute modules (54 questions);
 * Math is 70 minutes over two 35-minute modules (44 questions); 134 minutes and
 * 98 questions in total, with a 10-minute break between the sections.
 *
 * The first module of each section is a broad mix of difficulties. How the
 * student does on it decides whether the second module is the harder or the
 * easier one — that routing is the defining feature of the digital test, and
 * the reason Beacon models this rather than the non-adaptive paper version.
 */

export type ModuleTier = "routing" | "upper" | "lower";

export interface ModuleSpec {
  section: Section;
  index: 1 | 2;
  minutes: number;
  questions: number;
}

export const MODULES: ModuleSpec[] = [
  { section: "reading-writing", index: 1, minutes: 32, questions: 27 },
  { section: "reading-writing", index: 2, minutes: 32, questions: 27 },
  { section: "math", index: 1, minutes: 35, questions: 22 },
  { section: "math", index: 2, minutes: 35, questions: 22 },
];

export const BREAK_MINUTES = 10;

export const SECTION_LABEL: Record<Section, string> = {
  "reading-writing": "Reading and Writing",
  math: "Math",
};

/** Share of module 1 correct required to route into the harder second module. */
const UPPER_ROUTE_THRESHOLD = 0.6;

export function routeFor(correct: number, total: number): Exclude<ModuleTier, "routing"> {
  if (total === 0) return "lower";
  return correct / total >= UPPER_ROUTE_THRESHOLD ? "upper" : "lower";
}

/**
 * Converts raw correct answers into a section score on the 200–800 scale.
 *
 * The real conversion is a per-test equating table College Board does not
 * publish, and it is not a straight line — so this is an approximation, and the
 * UI says so rather than presenting the number as an official score.
 *
 * Two properties of the real test are preserved because they change how a
 * student should read the result: the scale does not start at zero, and being
 * routed into the lower second module caps the achievable score. A student who
 * gets everything right in the easier module has not demonstrated the same
 * thing as one who did it in the harder module, and a practice score that
 * ignored that would flatter them.
 */
export const SECTION_MIN = 200;
export const SECTION_MAX = 800;
const LOWER_ROUTE_CEILING = 600;

export function scaleSection(
  correct: number,
  total: number,
  route: Exclude<ModuleTier, "routing">
): number {
  if (total === 0) return SECTION_MIN;
  const ratio = Math.min(Math.max(correct / total, 0), 1);
  const ceiling = route === "upper" ? SECTION_MAX : LOWER_ROUTE_CEILING;
  const raw = SECTION_MIN + ratio * (ceiling - SECTION_MIN);
  // Reported in 10-point increments, as real SAT scores are.
  return Math.round(raw / 10) * 10;
}

export function totalScore(readingWriting: number, math: number): number {
  return readingWriting + math;
}

/** Minutes for the whole sitting, for the "do you have time?" prompt. */
export function totalMinutes(scale = 1): number {
  const testing = MODULES.reduce((sum, m) => sum + m.minutes * scale, 0);
  return Math.round(testing + BREAK_MINUTES);
}
