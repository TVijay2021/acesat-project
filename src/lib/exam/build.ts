import type { Question, Section } from "../types";
import { MODULES, type ModuleTier, type ModuleSpec } from "./format";

export interface ExamModule {
  spec: ModuleSpec;
  tier: ModuleTier;
  questionIds: string[];
}

export interface ExamBlueprint {
  id: string;
  createdAt: number;
  /** 1 when every module is full length; below 1 when the bank is too small. */
  scale: number;
  /** Module 1 for each section. Module 2 is chosen after routing. */
  openers: ExamModule[];
  /** Both candidate second modules per section, picked from at routing time. */
  followers: Record<Section, { upper: ExamModule; lower: ExamModule }>;
}

/**
 * Splits a bank into easier and harder halves.
 *
 * The bank carries no difficulty label, so this infers one: questions the
 * student population gets wrong more often sit higher. With no attempt history
 * to draw on it falls back to a stable proxy — grid-in maths and longer stems
 * are reliably harder than short multiple choice — which is crude but honest,
 * and far better than routing at random.
 */
function byDifficulty(questions: Question[]): { easier: Question[]; harder: Question[] } {
  const scored = questions
    .map((question) => ({
      question,
      weight:
        (question.format === "grid-in" ? 2 : 0) +
        Math.min(question.stem.length / 400, 2),
    }))
    .sort((a, b) => a.weight - b.weight);

  const mid = Math.floor(scored.length / 2);
  return {
    easier: scored.slice(0, mid).map((s) => s.question),
    harder: scored.slice(mid).map((s) => s.question),
  };
}

/** Rotates through a pool so modules don't all draw the same opening items. */
function take(pool: Question[], count: number, offset: number): string[] {
  if (pool.length === 0) return [];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(pool[(offset + i) % pool.length].id);
  }
  return [...new Set(out)];
}

/**
 * Assembles a full-length adaptive practice test from the question bank.
 *
 * Returns null when there is not enough material to make even a shortened
 * sitting worth the student's time. When the bank cannot fill full modules the
 * test is scaled down proportionally rather than padded with repeats, and the
 * caller surfaces the shortened length — a "full-length practice test" that is
 * quietly half repeats would misrepresent both the score and the endurance.
 */
export function buildExam(questions: Question[], now = Date.now()): ExamBlueprint | null {
  const bySection: Record<Section, Question[]> = {
    "reading-writing": questions.filter((q) => q.section === "reading-writing"),
    math: questions.filter((q) => q.section === "math"),
  };

  // The scale the smallest section can actually support, capped at full length.
  const scale = Math.min(
    1,
    ...MODULES.map((spec) => {
      const available = bySection[spec.section].length;
      // Each section needs two modules' worth of distinct questions.
      return available / (spec.questions * 2);
    })
  );

  if (scale < 0.25) return null;

  const sized = (spec: ModuleSpec) => Math.max(4, Math.round(spec.questions * scale));

  const openers: ExamModule[] = [];
  const followers = {} as ExamBlueprint["followers"];

  for (const section of ["reading-writing", "math"] as Section[]) {
    const pool = bySection[section];
    const { easier, harder } = byDifficulty(pool);
    const spec1 = MODULES.find((m) => m.section === section && m.index === 1)!;
    const spec2 = MODULES.find((m) => m.section === section && m.index === 2)!;
    const count1 = sized(spec1);
    const count2 = sized(spec2);

    // Module 1 is a deliberate mix of both halves — it has to discriminate.
    const mixed = [...easier, ...harder].sort(
      (a, b) => a.id.localeCompare(b.id)
    );

    openers.push({
      spec: spec1,
      tier: "routing",
      questionIds: take(mixed, count1, 0),
    });

    followers[section] = {
      upper: { spec: spec2, tier: "upper", questionIds: take(harder, count2, 0) },
      lower: { spec: spec2, tier: "lower", questionIds: take(easier, count2, 0) },
    };
  }

  return { id: `exam-${now}`, createdAt: now, scale, openers, followers };
}
