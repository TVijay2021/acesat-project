// Proves the Decision Ledger loop end to end without a browser or a network:
// diagnose a weakness, record a falsifiable prediction, then grade it against
// later attempts. Run with `node scripts/agent-smoke.ts`.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildPredictionCheck, describe, diagnose } from "../src/lib/agent/decide";
import { gradeDecision } from "../src/lib/agent/grade";
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
