// Proves the Decision Ledger loop end to end without a browser or a network:
// diagnose a weakness, record a falsifiable prediction, then grade it against
// later attempts. Run with `node scripts/agent-smoke.ts`.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildPredictionCheck, describe, diagnose } from "../src/lib/agent/decide";
import { gradeDecision } from "../src/lib/agent/grade";
import { analyseCalibration } from "../src/lib/agent/calibration";
import { buildExam } from "../src/lib/exam/build";
import { routeFor, scaleSection } from "../src/lib/exam/format";
import { scoreExam, type ExamAnswer } from "../src/lib/exam/result";
import type { Attempt, Decision, Question } from "../src/lib/types";

const here = dirname(fileURLToPath(import.meta.url));
const bank = JSON.parse(
  readFileSync(resolve(here, "../src/data/questions.generated.json"), "utf8")
) as { questions: Question[] };

const questions = new Map(bank.questions.map((q) => [q.id, q]));

// Fixed-size samples, so the scenario below stays the one described no matter
// how large the bank grows. Taking the comparison set from the front of the
// bank would otherwise draw all nine questions from a single domain and make
// that domain, rather than algebra, look like the weakness.
const algebra = bank.questions.filter((q) => q.domain === "Algebra").slice(0, 6);

const spread = new Map<string, Question[]>();
for (const question of bank.questions) {
  if (question.domain === "Algebra") continue;
  const seen = spread.get(question.domain) ?? [];
  if (seen.length < 2) seen.push(question);
  spread.set(question.domain, seen);
}
const other = [...spread.values()].flat().slice(0, 9);

let clock = Date.UTC(2026, 7, 1);
function attempt(
  question: Question,
  correct: boolean,
  elapsedMs: number
): Attempt {
  clock += 60_000;
  return {
    questionId: question.id,
    sessionId: "smoke",
    response: correct ? question.answer : "Z",
    correct,
    elapsedMs,
    confidence: "sure",
    mistakeReason: null,
    answeredAt: clock,
    synced: true,
  };
}

// A student who knows algebra but burns clock on it: 5 of 6 correct, ~95s each,
// against ~50s on everything else.
const history: Attempt[] = [
  ...algebra.map((q, i) => attempt(q, i !== 0, 95_000)),
  ...other.slice(0, 9).map((q, i) => attempt(q, i % 4 !== 0, 50_000)),
];

const diagnosis = diagnose(history, questions);
assert.ok(diagnosis, "expected a diagnosis from a clear timing pattern");
assert.equal(diagnosis.area.domain, "Algebra");
assert.equal(diagnosis.signal, "slow-but-accurate");
assert.equal(diagnosis.kind, "timing");

const copy = describe(diagnosis);
const check = buildPredictionCheck(diagnosis);
assert.equal(check.metric, "medianTimeMs");
assert.ok(check.guardAccuracy !== undefined, "timing predictions must guard accuracy");

const decision: Decision = {
  id: "smoke-1",
  createdAt: clock,
  focus: copy.focus,
  evidence: copy.evidence,
  action: copy.action,
  prediction: copy.prediction,
  predictionCheck: check,
  outcome: "pending",
  outcomeNote: null,
  gradedAt: null,
  authored: false,
};

console.log(`Focus     ${decision.focus}`);
console.log(`Evidence  ${decision.evidence}`);
console.log(`Predicts  ${decision.prediction}`);

// Case 1: the drill worked — faster, accuracy intact.
const improved = [...history, ...algebra.map((q, i) => attempt(q, i !== 0, 70_000))];
const confirmed = gradeDecision(decision, improved, questions);
assert.ok(confirmed, "expected enough evidence to grade");
assert.equal(confirmed.outcome, "confirmed");
console.log(`\nConfirmed ${confirmed.note}`);
console.log(`Learned   ${confirmed.lesson}`);

// Case 2: the student got faster but started missing questions. Beacon must
// call its own prediction wrong rather than claim the speed-up as a win.
const regressed = [
  ...history,
  ...algebra.map((q, i) => attempt(q, i > 3, 70_000)),
];
const missed = gradeDecision(decision, regressed, questions);
assert.ok(missed, "expected enough evidence to grade");
assert.equal(missed.outcome, "missed");
console.log(`\nMissed    ${missed.note}`);
console.log(`Learned   ${missed.lesson}`);

// Case 3: too little new evidence stays pending rather than guessing.
const thin = [...history, attempt(algebra[0], true, 70_000)];
assert.equal(gradeDecision(decision, thin, questions), null);
console.log("\nPending   held back on 1 new attempt, as expected");

console.log("\nAgent smoke test passed.");

// ── Confidence calibration ────────────────────────────────────────────────
// A student who is confidently wrong should be diagnosed on their judgement,
// not sent to do more questions in the same domain.
{
  const reading = bank.questions.filter(
    (q) => q.domain === "Craft and Structure"
  );
  const confidentlyWrong: Attempt[] = [];
  let t = Date.UTC(2026, 7, 1);
  for (const [i, q] of reading.slice(0, 10).entries()) {
    t += 60_000;
    confidentlyWrong.push({
      questionId: q.id,
      sessionId: "calib",
      response: "Z",
      // Sure on all ten, right on only three.
      correct: i < 3,
      elapsedMs: 55_000,
      confidence: "sure",
      mistakeReason: null,
      answeredAt: t,
      synced: true,
    });
  }

  const report = analyseCalibration(confidentlyWrong, questions);
  assert.equal(report.verdict, "overconfident");
  assert.equal(report.falseConfidence, 7);
  assert.equal(report.weakestArea?.domain, "Craft and Structure");

  const d = diagnose(confidentlyWrong, questions);
  assert.ok(d, "expected a diagnosis");
  assert.equal(d.signal, "overconfident", "judgement outranks domain practice");
  assert.equal(d.kind, "strategy");

  const check = buildPredictionCheck(d);
  assert.equal(
    check.scope.confidence,
    "sure",
    "an overconfidence prediction must be graded only over confident answers"
  );

  console.log(`\nCalibration ${report.headline}`);
  console.log(`             ${report.detail}`);

  // Too few answers must stay silent rather than guess at a pattern.
  const thin = analyseCalibration(confidentlyWrong.slice(0, 5), questions);
  assert.equal(thin.verdict, "insufficient");
  console.log("             held back on 5 answers, as expected");
}

console.log("\nCalibration smoke test passed.");

// ── Full-length adaptive practice test ────────────────────────────────────
{
  const blueprint = buildExam(bank.questions);
  assert.ok(blueprint, "expected the bank to support a sitting");
  assert.equal(blueprint.openers.length, 2, "one opening module per section");

  // Module 2 must differ by route, or the adaptive step is decorative.
  for (const section of ["reading-writing", "math"] as const) {
    const { upper, lower } = blueprint.followers[section];
    const overlap = upper.questionIds.filter((id) =>
      lower.questionIds.includes(id)
    );
    assert.equal(
      overlap.length,
      0,
      `${section}: harder and easier module 2 must not share questions`
    );
  }

  // Routing: 60% of module 1 correct sends the student to the harder module.
  assert.equal(routeFor(6, 10), "upper");
  assert.equal(routeFor(5, 10), "lower");
  assert.equal(routeFor(0, 0), "lower");

  // The easier second module caps the section score, as on the real test.
  assert.equal(scaleSection(20, 20, "upper"), 800);
  assert.ok(
    scaleSection(20, 20, "lower") < 800,
    "a perfect lower-module score must not reach 800"
  );
  assert.equal(scaleSection(0, 20, "upper"), 200, "the scale floors at 200");

  // A blank answer is wrong, and is reported as unanswered rather than hidden.
  const answers: ExamAnswer[] = blueprint.openers[0].questionIds
    .slice(0, 6)
    .map((questionId, i) => ({
      questionId,
      section: "reading-writing" as const,
      moduleIndex: 1 as const,
      response: i < 4 ? "A" : "",
      correct: false,
      elapsedMs: 40_000,
      ranOutOfTime: i >= 4,
    }));

  const result = scoreExam(
    "exam-test",
    answers,
    { "reading-writing": "lower", math: "lower" },
    questions
  );
  assert.ok(
    result.findings.some((f) => f.includes("blank")),
    "leaving questions blank must be called out"
  );
  assert.ok(
    result.findings.some((f) => f.includes("timer ran out")),
    "running out of time must be called out"
  );
  assert.ok(result.recommendation.length > 0);

  console.log(`\nExam       full sitting: ${blueprint.openers[0].questionIds.length} + ${blueprint.followers["reading-writing"].upper.questionIds.length} R&W, scale ${blueprint.scale.toFixed(2)}`);
  console.log(`           ${result.findings[0]}`);
  console.log(`           ${result.recommendation}`);
}

console.log("\nExam smoke test passed.");
