import type { Question, Section } from "../types";
import { percent, seconds } from "../agent/analyze";
import {
  SECTION_LABEL,
  scaleSection,
  totalScore,
  type ModuleTier,
} from "./format";

export interface ExamAnswer {
  questionId: string;
  section: Section;
  moduleIndex: 1 | 2;
  response: string;
  correct: boolean;
  elapsedMs: number;
  /** True when the module timer expired before the student answered. */
  ranOutOfTime: boolean;
}

export interface SectionResult {
  section: Section;
  label: string;
  correct: number;
  total: number;
  score: number;
  route: Exclude<ModuleTier, "routing">;
  unanswered: number;
}

export interface ExamResult {
  examId: string;
  finishedAt: number;
  sections: SectionResult[];
  total: number;
  /** Where marks were lost, strongest signal first. */
  findings: string[];
  /** What to do about it — feeds the next route. */
  recommendation: string;
  weakestDomain: string | null;
}

export function scoreExam(
  examId: string,
  answers: ExamAnswer[],
  routes: Record<Section, Exclude<ModuleTier, "routing">>,
  questions: Map<string, Question>,
  now = Date.now()
): ExamResult {
  const sections = (["reading-writing", "math"] as Section[]).map((section) => {
    const group = answers.filter((a) => a.section === section);
    const correct = group.filter((a) => a.correct).length;
    return {
      section,
      label: SECTION_LABEL[section],
      correct,
      total: group.length,
      score: scaleSection(correct, group.length, routes[section]),
      route: routes[section],
      unanswered: group.filter((a) => a.response === "").length,
    };
  });

  const rw = sections[0].score;
  const math = sections[1].score;
  const weakestDomain = worstDomain(answers, questions);

  return {
    examId,
    finishedAt: now,
    sections,
    total: totalScore(rw, math),
    findings: findingsFor(answers, sections, questions),
    recommendation: recommendationFor(answers, sections, weakestDomain),
    weakestDomain,
  };
}

/**
 * Observations a student can act on, not a wall of statistics.
 *
 * Ordered by what actually costs marks: questions left blank, then running out
 * of time, then a domain that is dragging, then pacing.
 */
function findingsFor(
  answers: ExamAnswer[],
  sections: SectionResult[],
  questions: Map<string, Question>
): string[] {
  const findings: string[] = [];

  const blank = answers.filter((a) => a.response === "").length;
  if (blank > 0) {
    findings.push(
      `You left ${blank} ${blank === 1 ? "question" : "questions"} blank. There is no penalty for a wrong answer on the SAT — a guess is strictly better than a blank.`
    );
  }

  const timedOut = answers.filter((a) => a.ranOutOfTime).length;
  if (timedOut > 0) {
    findings.push(
      `${timedOut} ${timedOut === 1 ? "question was" : "questions were"} still unanswered when the module timer ran out. That is a pacing problem, not a knowledge one.`
    );
  }

  const worst = worstDomain(answers, questions);
  if (worst) {
    const group = answers.filter(
      (a) => questions.get(a.questionId)?.domain === worst
    );
    const right = group.filter((a) => a.correct).length;
    findings.push(
      `${worst} was your weakest domain — ${right} of ${group.length} correct.`
    );
  }

  // Compare time spent on the questions gotten wrong against those gotten right.
  const rightTimes = answers.filter((a) => a.correct).map((a) => a.elapsedMs);
  const wrongTimes = answers.filter((a) => !a.correct && a.response).map((a) => a.elapsedMs);
  if (rightTimes.length >= 5 && wrongTimes.length >= 5) {
    const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    const rightAvg = avg(rightTimes);
    const wrongAvg = avg(wrongTimes);
    if (wrongAvg > rightAvg * 1.3) {
      findings.push(
        `The questions you missed took you ${seconds(wrongAvg - rightAvg)}s longer on average than the ones you got right. Recognising a lost cause early is worth more marks than pushing through it.`
      );
    } else if (rightAvg > wrongAvg * 1.3) {
      findings.push(
        `You moved fastest on the questions you got wrong. When an answer arrives quickly, that is the moment to check it.`
      );
    }
  }

  const lowerRouted = sections.filter((s) => s.route === "lower");
  if (lowerRouted.length) {
    findings.push(
      `${lowerRouted.map((s) => s.label).join(" and ")} routed to the easier second module, which caps the score that section can reach. Module 1 is where the ceiling gets set.`
    );
  }

  return findings;
}

function recommendationFor(
  answers: ExamAnswer[],
  sections: SectionResult[],
  weakestDomain: string | null
): string {
  const timedOut = answers.filter((a) => a.ranOutOfTime).length;
  if (timedOut >= 3) {
    return "Beacon will pack timed sets and skip-and-return drills before more content work. Finishing the module is worth more than perfecting any single question.";
  }
  const blank = answers.filter((a) => a.response === "").length;
  if (blank >= 3) {
    return "Beacon will drill the habit of always committing to an answer. Blanks are the cheapest marks on the table.";
  }
  if (weakestDomain) {
    return `Beacon will build the next route around ${weakestDomain}, starting untimed so accuracy comes before speed.`;
  }
  const weaker = [...sections].sort((a, b) => a.score - b.score)[0];
  return `Beacon will weight the next route toward ${weaker.label}.`;
}

function worstDomain(
  answers: ExamAnswer[],
  questions: Map<string, Question>
): string | null {
  const tally = new Map<string, { right: number; total: number }>();
  for (const answer of answers) {
    const question = questions.get(answer.questionId);
    if (!question) continue;
    const entry = tally.get(question.domain) ?? { right: 0, total: 0 };
    entry.total += 1;
    if (answer.correct) entry.right += 1;
    tally.set(question.domain, entry);
  }

  const ranked = [...tally.entries()]
    // Three questions is too thin a base to call a domain weak.
    .filter(([, e]) => e.total >= 3)
    .sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total);

  const worst = ranked[0];
  if (!worst || worst[1].right / worst[1].total >= 0.75) return null;
  return worst[0];
}

export { percent };
