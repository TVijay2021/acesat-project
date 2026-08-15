"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildExam, type ExamModule } from "@/lib/exam/build";
import {
  BREAK_MINUTES,
  routeFor,
  SECTION_LABEL,
  type ModuleTier,
} from "@/lib/exam/format";
import { scoreExam, type ExamAnswer } from "@/lib/exam/result";
import { db } from "@/lib/db";
import { useBeacon } from "@/lib/store";
import type { ExamRecord, Question, Section } from "@/lib/types";
import { Button, Eyebrow } from "./ui";
import { ExamReport } from "./ExamReport";

type Stage =
  | { kind: "intro"; module: ExamModule; order: number }
  | { kind: "module"; module: ExamModule; order: number }
  | { kind: "break" }
  | { kind: "report"; record: ExamRecord };

/**
 * A full-length adaptive practice sitting.
 *
 * Deliberately unlike the training runner: the timer is always visible, no
 * answer is marked and no explanation is shown until the whole test is over,
 * and the second module of each section is chosen by how the first went. The
 * point is to rehearse the conditions, not to learn mid-test.
 */
export function ExamRunner({ onExit }: { onExit: () => void }) {
  const { questions, refresh } = useBeacon();

  const blueprint = useMemo(
    () => buildExam([...questions.values()]),
    [questions]
  );

  const [stage, setStage] = useState<Stage | null>(null);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const routes = useRef<Partial<Record<Section, Exclude<ModuleTier, "routing">>>>(
    {}
  );

  useEffect(() => {
    if (blueprint && !stage) {
      setStage({ kind: "intro", module: blueprint.openers[0], order: 0 });
    }
  }, [blueprint, stage]);

  const finish = useCallback(
    async (all: ExamAnswer[]) => {
      if (!blueprint) return;
      const result = scoreExam(
        blueprint.id,
        all,
        {
          "reading-writing": routes.current["reading-writing"] ?? "lower",
          math: routes.current.math ?? "lower",
        },
        questions
      );
      const record: ExamRecord = {
        id: blueprint.id,
        takenAt: result.finishedAt,
        scale: blueprint.scale,
        readingWriting: result.sections[0].score,
        math: result.sections[1].score,
        total: result.total,
        correct: all.filter((a) => a.correct).length,
        answered: all.filter((a) => a.response !== "").length,
        questions: all.length,
        findings: result.findings,
        recommendation: result.recommendation,
        weakestDomain: result.weakestDomain,
      };
      await db.exams.put(record);
      await refresh();
      setStage({ kind: "report", record });
    },
    [blueprint, questions, refresh]
  );

  /** Advances past a finished module, routing or breaking as the format needs. */
  const advance = useCallback(
    (finished: ExamModule, order: number, moduleAnswers: ExamAnswer[]) => {
      if (!blueprint) return;
      const all = [...answers, ...moduleAnswers];
      setAnswers(all);

      // Module 1 decides the difficulty of module 2 for that section.
      if (finished.tier === "routing") {
        const correct = moduleAnswers.filter((a) => a.correct).length;
        const tier = routeFor(correct, moduleAnswers.length);
        routes.current[finished.spec.section] = tier;
        const next = blueprint.followers[finished.spec.section][tier];
        setStage({ kind: "intro", module: next, order: order + 1 });
        return;
      }

      // Second module done. Either break into Math, or the sitting is over.
      if (finished.spec.section === "reading-writing") {
        setStage({ kind: "break" });
        return;
      }
      void finish(all);
    },
    [answers, blueprint, finish]
  );

  if (!blueprint) {
    return (
      <Shell onExit={onExit}>
        <div className="space-y-3">
          <h2 className="font-display text-xl font-semibold">
            Not enough questions yet
          </h2>
          <p className="text-ink-muted text-sm leading-relaxed">
            A practice sitting needs a deeper bank than Beacon currently has
            offline. Check in while connected and try again.
          </p>
          <Button onClick={onExit} variant="quiet">
            Back
          </Button>
        </div>
      </Shell>
    );
  }

  if (!stage) return null;

  if (stage.kind === "report") {
    return (
      <Shell onExit={onExit} hideExit>
        <ExamReport record={stage.record} onDone={onExit} />
      </Shell>
    );
  }

  if (stage.kind === "break") {
    return (
      <Shell onExit={onExit}>
        <BreakScreen
          onContinue={() =>
            setStage({ kind: "intro", module: blueprint.openers[1], order: 2 })
          }
        />
      </Shell>
    );
  }

  if (stage.kind === "intro") {
    return (
      <Shell onExit={onExit}>
        <ModuleIntro
          module={stage.module}
          scale={blueprint.scale}
          onStart={() =>
            setStage({ kind: "module", module: stage.module, order: stage.order })
          }
        />
      </Shell>
    );
  }

  return (
    <Shell onExit={onExit} hideExit>
      <ModulePlayer
        key={stage.module.spec.section + stage.module.spec.index}
        module={stage.module}
        scale={blueprint.scale}
        questions={questions}
        onDone={(moduleAnswers) =>
          advance(stage.module, stage.order, moduleAnswers)
        }
      />
    </Shell>
  );
}

function ModuleIntro({
  module,
  scale,
  onStart,
}: {
  module: ExamModule;
  scale: number;
  onStart: () => void;
}) {
  const minutes = Math.max(2, Math.round(module.spec.minutes * scale));
  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>{SECTION_LABEL[module.spec.section]}</Eyebrow>
        <h2 className="font-display mt-1 text-2xl font-semibold">
          Module {module.spec.index} of 2
        </h2>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          {module.questionIds.length} questions · {minutes} minutes. You can move
          back and forth within the module. Nothing is marked until the whole
          test is finished.
        </p>
      </div>
      {module.tier !== "routing" && (
        <p className="text-ink-faint text-xs leading-relaxed">
          Based on module 1, this is the{" "}
          {module.tier === "upper" ? "harder" : "easier"} second module.
        </p>
      )}
      <Button onClick={onStart}>Start module</Button>
    </div>
  );
}

function BreakScreen({ onContinue }: { onContinue: () => void }) {
  const [left, setLeft] = useState(BREAK_MINUTES * 60);
  useEffect(() => {
    const t = setInterval(() => setLeft((n) => Math.max(n - 1, 0)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-5 text-center">
      <Eyebrow>Break</Eyebrow>
      <p className="tabular font-display text-4xl font-semibold">
        {clock(left * 1000)}
      </p>
      <p className="text-ink-muted text-sm leading-relaxed">
        Ten minutes between sections, the same as test day. Stand up and look at
        something far away.
      </p>
      <Button onClick={onContinue}>
        {left > 0 ? "Skip the break and continue" : "Continue to Math"}
      </Button>
    </div>
  );
}

function ModulePlayer({
  module,
  scale,
  questions,
  onDone,
}: {
  module: ExamModule;
  scale: number;
  questions: Map<string, Question>;
  onDone: (answers: ExamAnswer[]) => void;
}) {
  // A shortened sitting gets proportionally less time, so the per-question
  // pressure matches a real module. Running 21 questions on the full 32-minute
  // clock would rehearse the wrong pace.
  const limitMs = Math.max(2, Math.round(module.spec.minutes * scale)) * 60_000;
  const items = module.questionIds
    .map((id) => questions.get(id))
    .filter((q): q is Question => Boolean(q));

  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [remainingMs, setRemainingMs] = useState(limitMs);
  const startedAt = useRef(Date.now());
  const perQuestionStart = useRef(Date.now());
  const times = useRef<Record<string, number>>({});
  const submitted = useRef(false);

  const submit = useCallback(
    (timedOut: boolean) => {
      if (submitted.current) return;
      submitted.current = true;
      // Bank the time on whichever question was open when the module ended.
      const open = items[index];
      if (open) {
        times.current[open.id] =
          (times.current[open.id] ?? 0) + (Date.now() - perQuestionStart.current);
      }
      onDone(
        items.map((question) => {
          const response = responses[question.id] ?? "";
          return {
            questionId: question.id,
            section: module.spec.section,
            moduleIndex: module.spec.index,
            response,
            correct: isCorrect(question, response),
            elapsedMs: times.current[question.id] ?? 0,
            ranOutOfTime: timedOut && response === "",
          };
        })
      );
    },
    [index, items, module.spec, onDone, responses]
  );

  useEffect(() => {
    const tick = setInterval(() => {
      const left = limitMs - (Date.now() - startedAt.current);
      setRemainingMs(left);
      if (left <= 0) submit(true);
    }, 250);
    return () => clearInterval(tick);
  }, [limitMs, submit]);

  function go(next: number) {
    const current = items[index];
    if (current) {
      times.current[current.id] =
        (times.current[current.id] ?? 0) + (Date.now() - perQuestionStart.current);
    }
    perQuestionStart.current = Date.now();
    setIndex(next);
  }

  const question = items[index];
  if (!question) return null;

  const answeredCount = items.filter((q) => responses[q.id]).length;
  const low = remainingMs <= 5 * 60_000;

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>
          {SECTION_LABEL[module.spec.section]} · Module {module.spec.index}
        </Eyebrow>
        <span
          className="tabular font-display text-lg font-semibold"
          style={{ color: low ? "var(--danger)" : "var(--text)" }}
          role="timer"
          aria-live="off"
        >
          {clock(remainingMs)}
        </span>
      </div>

      <div
        className="bg-surface-2 h-1 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={items.length}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${((index + 1) / items.length) * 100}%`,
            background: "var(--amber)",
          }}
        />
      </div>

      <p className="text-ink-faint text-xs">
        Question {index + 1} of {items.length} · {answeredCount} answered
      </p>

      <p className="text-[17px] leading-[1.65]">{question.stem}</p>

      {question.format === "multiple-choice" ? (
        <ul className="space-y-2.5">
          {question.choices.map((choice) => {
            const selected = responses[question.id] === choice.label;
            return (
              <li key={choice.label}>
                <button
                  type="button"
                  onClick={() =>
                    setResponses((r) => ({ ...r, [question.id]: choice.label }))
                  }
                  aria-pressed={selected}
                  className="border-line flex w-full items-start gap-3 rounded-xl border p-4 text-left text-[15px] leading-relaxed"
                  style={{
                    background: selected ? "var(--surface-2)" : "var(--surface)",
                    borderColor: selected
                      ? "var(--border-strong)"
                      : "var(--border)",
                  }}
                >
                  <span className="tabular font-display shrink-0 font-semibold">
                    {choice.label}
                  </span>
                  <span className="min-w-0 flex-1">{choice.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <input
          inputMode="text"
          value={responses[question.id] ?? ""}
          onChange={(e) =>
            setResponses((r) => ({ ...r, [question.id]: e.target.value }))
          }
          placeholder="Your answer"
          aria-label="Your answer"
          className="border-line bg-surface min-h-12 w-full rounded-xl border px-4 text-[17px]"
        />
      )}

      <div className="flex gap-3">
        <Button
          variant="quiet"
          onClick={() => go(Math.max(index - 1, 0))}
          disabled={index === 0}
        >
          Back
        </Button>
        {index < items.length - 1 ? (
          <Button onClick={() => go(index + 1)}>Next</Button>
        ) : (
          <Button onClick={() => submit(false)}>Finish module</Button>
        )}
      </div>
    </div>
  );
}

function isCorrect(question: Question, response: string): boolean {
  if (!response) return false;
  if (question.format === "multiple-choice") return response === question.answer;
  return question.answer
    .split(",")
    .map((a) => a.trim())
    .includes(response.trim());
}

function clock(ms: number): string {
  const total = Math.max(Math.floor(ms / 1000), 0);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Shell({
  children,
  onExit,
  hideExit = false,
}: {
  children: React.ReactNode;
  onExit: () => void;
  hideExit?: boolean;
}) {
  return (
    <div className="bg-bg fixed inset-0 z-40 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 pt-4 pb-16">
        {!hideExit && (
          <button
            type="button"
            onClick={onExit}
            className="text-ink-faint mb-4 min-h-11 text-sm font-medium"
          >
            ← Leave the test
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
