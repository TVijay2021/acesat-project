"use client";

import { useEffect, useRef, useState } from "react";
import { useBeacon } from "@/lib/store";
import type { Confidence, MistakeReason, TrainingSession } from "@/lib/types";
import { Button, Eyebrow } from "./ui";

const MISTAKE_REASONS: { id: MistakeReason; label: string }[] = [
  { id: "concept", label: "I didn't know the concept" },
  { id: "misread", label: "I misread the question" },
  { id: "rushed", label: "I rushed" },
  { id: "overthought", label: "I overthought it" },
  { id: "wrong-strategy", label: "I used the wrong strategy" },
  { id: "careless", label: "Careless mistake" },
];

const CONFIDENCE: { id: Confidence; label: string }[] = [
  { id: "sure", label: "Sure" },
  { id: "unsure", label: "Unsure" },
  { id: "guess", label: "Guess" },
];

type Phase = "answering" | "reviewing";

export function QuestionRunner({
  session,
  onExit,
}: {
  session: TrainingSession;
  onExit: () => void;
}) {
  const { questions, online, recordAttempt, completeSession } = useBeacon();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("answering");
  const [response, setResponse] = useState("");
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [reason, setReason] = useState<MistakeReason | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const startedAt = useRef(Date.now());

  const questionId = session.questionIds[index];
  const question = questions.get(questionId);
  const isLast = index === session.questionIds.length - 1;

  useEffect(() => {
    startedAt.current = Date.now();
  }, [index]);

  if (!question) {
    return (
      <Shell onExit={onExit}>
        <p className="text-sm">This question isn&rsquo;t available offline yet.</p>
      </Shell>
    );
  }

  const correct =
    question.format === "multiple-choice"
      ? response === question.answer
      : question.answer
          .split(",")
          .map((a) => a.trim())
          .includes(response.trim());

  async function submit() {
    if (!response || !confidence) return;
    await recordAttempt({
      questionId: question!.id,
      sessionId: session.id,
      response,
      correct,
      elapsedMs: Date.now() - startedAt.current,
      confidence,
      mistakeReason: null,
      answeredAt: Date.now(),
      synced: false,
    });
    if (correct) setCorrectCount((n) => n + 1);
    setPhase("reviewing");
  }

  async function advance() {
    if (isLast) {
      await completeSession(session.id);
      onExit();
      return;
    }
    setIndex((i) => i + 1);
    setResponse("");
    setConfidence(null);
    setReason(null);
    setPhase("answering");
  }

  return (
    <Shell onExit={onExit}>
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Eyebrow>
              {session.title} · {index + 1} of {session.questionIds.length}
            </Eyebrow>
            {!online && (
              <span className="text-ink-faint text-[10px] tracking-wide uppercase">
                Offline
              </span>
            )}
          </div>
          <div
            className="bg-surface-2 h-1 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={session.questionIds.length}
          >
            <div
              className="h-full rounded-full transition-[width]"
              style={{
                width: `${((index + (phase === "reviewing" ? 1 : 0)) / session.questionIds.length) * 100}%`,
                background: "var(--amber)",
              }}
            />
          </div>
        </div>

        <p className="text-[17px] leading-[1.65]">{question.stem}</p>

        {question.format === "multiple-choice" ? (
          <ul className="space-y-2.5">
            {question.choices.map((choice) => {
              const selected = response === choice.label;
              const isAnswer = choice.label === question.answer;
              const showResult = phase === "reviewing";
              return (
                <li key={choice.label}>
                  <button
                    type="button"
                    disabled={phase === "reviewing"}
                    onClick={() => setResponse(choice.label)}
                    className="border-line flex w-full items-start gap-3 rounded-xl border
                               p-4 text-left text-[15px] leading-relaxed"
                    style={{
                      background:
                        showResult && isAnswer
                          ? "color-mix(in oklch, var(--seafoam) 16%, var(--surface))"
                          : selected
                            ? "var(--surface-2)"
                            : "var(--surface)",
                      borderColor:
                        showResult && isAnswer
                          ? "var(--seafoam)"
                          : showResult && selected
                            ? "var(--danger)"
                            : selected
                              ? "var(--border-strong)"
                              : "var(--border)",
                    }}
                  >
                    <span className="tabular font-display shrink-0 font-semibold">
                      {choice.label}
                    </span>
                    <span className="min-w-0 flex-1">{choice.text}</span>
                    {showResult && (isAnswer || selected) && (
                      <span aria-hidden className="shrink-0 text-sm">
                        {isAnswer ? "✓" : "✕"}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <input
            inputMode="text"
            value={response}
            disabled={phase === "reviewing"}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Your answer"
            aria-label="Your answer"
            className="border-line bg-surface min-h-12 w-full rounded-xl border px-4 text-[17px]"
          />
        )}

        {phase === "answering" ? (
          <div className="space-y-3">
            <div>
              <Eyebrow>How sure are you?</Eyebrow>
              <div className="mt-2 flex gap-2">
                {CONFIDENCE.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setConfidence(option.id)}
                    aria-pressed={confidence === option.id}
                    className="border-line min-h-11 flex-1 rounded-xl border text-sm font-medium"
                    style={{
                      background:
                        confidence === option.id
                          ? "var(--surface-2)"
                          : "var(--surface)",
                      borderColor:
                        confidence === option.id
                          ? "var(--border-strong)"
                          : "var(--border)",
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={submit} disabled={!response || !confidence}>
              Submit
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--surface-2)",
                borderLeft: `3px solid ${correct ? "var(--seafoam)" : "var(--danger)"}`,
              }}
            >
              <p className="text-sm font-semibold">
                {correct ? "Correct" : `Answer: ${question.answer}`}
              </p>
              <p className="text-ink-muted mt-1.5 text-sm leading-relaxed">
                {question.explanation}
              </p>
            </div>

            {!correct && (
              <div>
                <Eyebrow>What happened?</Eyebrow>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {MISTAKE_REASONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setReason(option.id)}
                      aria-pressed={reason === option.id}
                      className="border-line min-h-12 rounded-xl border px-3 text-[13px]
                                 leading-snug font-medium"
                      style={{
                        background:
                          reason === option.id
                            ? "var(--surface-2)"
                            : "var(--surface)",
                        borderColor:
                          reason === option.id
                            ? "var(--border-strong)"
                            : "var(--border)",
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={advance}>
              {isLast ? "Finish session" : "Next question"}
            </Button>
          </div>
        )}

        {phase === "reviewing" && isLast && (
          <p className="text-ink-faint text-center text-xs">
            {correctCount + (correct ? 1 : 0)} of {session.questionIds.length}{" "}
            correct · saved locally
          </p>
        )}
      </div>
    </Shell>
  );
}

function Shell({
  children,
  onExit,
}: {
  children: React.ReactNode;
  onExit: () => void;
}) {
  return (
    <div className="bg-bg fixed inset-0 z-30 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 pt-4 pb-16">
        <button
          type="button"
          onClick={onExit}
          className="text-ink-faint mb-4 min-h-11 text-sm font-medium"
        >
          ← Pause and exit
        </button>
        {children}
      </div>
    </div>
  );
}
