import { NextResponse } from "next/server";
import bank from "@/data/questions.generated.json";
import { authorCopy } from "@/lib/agent/author";
import {
  buildPredictionCheck,
  describe,
  diagnose,
  selectQuestions,
} from "@/lib/agent/decide";
import { gradeDecision } from "@/lib/agent/grade";
import type {
  Attempt,
  Decision,
  Question,
  Route,
  TrainingKind,
  TrainingSession,
} from "@/lib/types";

const questions = bank.questions as Question[];
const questionMap = new Map(questions.map((q) => [q.id, q]));

export interface SyncRequest {
  attempts: Attempt[];
  decisions: Decision[];
}

export interface SyncResponse {
  graded: {
    id: string;
    outcome: "confirmed" | "missed";
    outcomeNote: string;
    lesson: string;
  }[];
  decision: Decision | null;
  route: Route | null;
  sessions: TrainingSession[];
  /** True when Claude wrote the student-facing copy. */
  authored: boolean;
}

/**
 * The only online code path in the app.
 *
 * Everything here is deterministic except the final copy pass: grade the
 * predictions Beacon already made, diagnose what to work on next, pack a route.
 * A missing API key changes the prose, not the coaching.
 */
export async function POST(request: Request) {
  let body: SyncRequest;
  try {
    body = (await request.json()) as SyncRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const attempts = Array.isArray(body.attempts) ? body.attempts : [];
  const decisions = Array.isArray(body.decisions) ? body.decisions : [];

  // 1. Check the predictions Beacon already made.
  const graded: SyncResponse["graded"] = [];
  for (const decision of decisions) {
    if (decision.outcome !== "pending") continue;
    const grade = gradeDecision(decision, attempts, questionMap);
    if (!grade) continue;
    graded.push({
      id: decision.id,
      outcome: grade.outcome,
      outcomeNote: grade.note,
      lesson: grade.lesson,
    });
  }

  // Grading feeds the next choice, so apply the outcomes before diagnosing.
  const settled = decisions.map((decision) => {
    const grade = graded.find((g) => g.id === decision.id);
    return grade
      ? { ...decision, outcome: grade.outcome, outcomeNote: grade.outcomeNote }
      : decision;
  });

  // 2. Decide what to work on next.
  const diagnosis = diagnose(attempts, questionMap, settled);
  if (!diagnosis) {
    return NextResponse.json<SyncResponse>({
      graded,
      decision: null,
      route: null,
      sessions: [],
      authored: false,
    });
  }

  const copy = describe(diagnosis);
  const authored = await authorCopy(copy);
  const now = Date.now();

  const decision: Decision = {
    id: `dec-${now}`,
    createdAt: now,
    focus: copy.focus,
    evidence: authored?.evidence ?? copy.evidence,
    action: copy.action,
    prediction: authored?.prediction ?? copy.prediction,
    predictionCheck: buildPredictionCheck(diagnosis),
    outcome: "pending",
    outcomeNote: null,
    gradedAt: null,
    authored: authored !== null,
  };

  // 3. Pack the offline route.
  const route: Route = {
    id: `route-${now}`,
    createdAt: now,
    primaryFocus: copy.focus,
    secondaryFocus: secondaryFocus(diagnosis.area.label),
    rationale: decision.evidence,
    days: 4,
    decisionId: decision.id,
  };

  const sessions = packSessions(route, diagnosis, attempts);

  return NextResponse.json<SyncResponse>({
    graded,
    decision,
    route,
    sessions,
    authored: authored !== null,
  });
}

function secondaryFocus(primaryLabel: string): string {
  return primaryLabel === "Craft and Structure"
    ? "Algebra"
    : "Craft and Structure";
}

const BLOCK_TITLE: Record<TrainingKind, string> = {
  timing: "Timing Sprint",
  grammar: "Grammar Reps",
  reading: "Reading Evidence",
  strategy: "Strategy Set",
};

function packSessions(
  route: Route,
  diagnosis: ReturnType<typeof diagnose>,
  attempts: Attempt[]
): TrainingSession[] {
  if (!diagnosis) return [];

  // Two blocks on the diagnosed weakness, then a contrasting one and a mixed
  // set. Without the contrast step a "reading" diagnosis packs a route of four
  // near-identical blocks, which reads as padding rather than a plan.
  const complement: TrainingKind =
    diagnosis.kind === "reading" ? "timing" : "reading";
  const kinds: TrainingKind[] = [
    diagnosis.kind,
    diagnosis.kind,
    complement,
    "strategy",
  ];

  // Withhold questions already assigned to an earlier block, so no two blocks
  // in a route serve the same item. This replaces an earlier rotation of the
  // input list, which stopped separating the blocks once the bank grew large
  // enough that a two-question shift no longer changed the ranking.
  const assigned = new Set<string>();

  return kinds.map((kind, day) => {
    const questionIds = selectQuestions(
      diagnosis,
      questions.filter((q) => !assigned.has(q.id)),
      attempts,
      4
    );
    questionIds.forEach((id) => assigned.add(id));

    return {
      id: `${route.id}-s${day}`,
      routeId: route.id,
      title: BLOCK_TITLE[kind],
      kind,
      // The two blocks on the primary weakness get different framing so the
      // route reads as a progression rather than the same session twice.
      intent: day === 1 && kinds[0] === kind ? FOLLOW_UP[kind] : INTENT[kind],
      estimatedMinutes: kind === "reading" ? 12 : kind === "strategy" ? 10 : 8,
      questionIds,
      completedAt: null,
      day,
    };
  });
}

const INTENT: Record<TrainingKind, string> = {
  timing: "Improve skip-and-return decisions.",
  grammar: "Strengthen comma and modifier recognition.",
  reading: "Practise finding the exact sentence that supports an answer.",
  strategy: "Choose an approach before you start solving.",
};

const FOLLOW_UP: Record<TrainingKind, string> = {
  timing: "Hold that pace when a question looks long.",
  grammar: "Spot the same patterns without pausing to check.",
  reading: "Do it again under time, without re-reading the passage twice.",
  strategy: "Commit to your first approach and see it through.",
};
