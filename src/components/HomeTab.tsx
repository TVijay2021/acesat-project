"use client";

import { useMemo } from "react";
import { nextSessionOf, useBeacon } from "@/lib/store";
import { subjectOf, SUBJECT_META, SUBJECTS, type Subject } from "@/lib/subjects";
import { Button, Card, Eyebrow } from "./ui";

export function HomeTab({
  onStart,
  onPractise,
}: {
  onStart: () => void;
  onPractise: (subject: Subject) => void;
}) {
  const { online, route, sessions, decisions, attempts, questions, setTab, startSync } =
    useBeacon();
  const next = nextSessionOf(sessions);
  const remaining = sessions.filter((s) => s.completedAt === null).length;
  const pending = decisions.find((d) => d.outcome === "pending");
  const unsynced = attempts.filter((a) => !a.synced).length;

  // Per-subject accuracy, so each card says something true about the student
  // rather than being a decorative button.
  const stats = useMemo(() => {
    const tally: Record<Subject, { right: number; total: number }> = {
      math: { right: 0, total: 0 },
      reading: { right: 0, total: 0 },
      writing: { right: 0, total: 0 },
    };
    for (const attempt of attempts) {
      const question = questions.get(attempt.questionId);
      if (!question) continue;
      const subject = subjectOf(question.domain);
      tally[subject].total += 1;
      if (attempt.correct) tally[subject].right += 1;
    }
    return tally;
  }, [attempts, questions]);

  // Which subject the recommendation actually drills. Taken from the questions
  // in the block rather than the focus label, since a label like "Timing under
  // pressure" names a habit and not a subject.
  const recommendedSubject: Subject | null = useMemo(() => {
    if (!next) return null;
    const counts = new Map<Subject, number>();
    for (const id of next.questionIds) {
      const question = questions.get(id);
      if (!question) continue;
      const subject = subjectOf(question.domain);
      counts.set(subject, (counts.get(subject) ?? 0) + 1);
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : null;
  }, [next, questions]);

  return (
    <div className="space-y-5">
      {/* Offline is stated as a capability, never as an error. */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: online ? "var(--seafoam)" : "var(--amber)" }}
          />
          <p className="text-sm font-medium">
            {online ? "Beacon connected" : "Offline · training continues"}
          </p>
        </div>
        {online ? (
          <button
            type="button"
            onClick={startSync}
            className="text-ink-muted min-h-9 text-[13px] font-semibold underline underline-offset-4"
          >
            {unsynced > 0 ? `Check in · ${unsynced} new` : "Check in"}
          </button>
        ) : (
          unsynced > 0 && (
            <span className="text-ink-faint text-xs">{unsynced} saved</span>
          )
        )}
      </div>

      {/* ── Recommended ─────────────────────────────────────────────────── */}
      {route && next ? (
        <Card
          className="space-y-4"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklch, var(--amber) 9%, var(--surface)), var(--surface))",
          }}
        >
          <div className="flex items-center gap-2">
            <Eyebrow>Recommended for you</Eyebrow>
          </div>

          <div className="space-y-1.5">
            <h2 className="font-display text-[22px] leading-tight font-semibold">
              {next.title}
            </h2>
            <p className="text-ink-muted text-sm leading-relaxed">{next.intent}</p>
          </div>

          <p className="text-ink-muted border-line border-l-2 pl-3 text-[13px] leading-relaxed"
             style={{ borderColor: "var(--amber)" }}>
            {route.rationale}
          </p>

          <Button onClick={onStart}>
            Start · {next.estimatedMinutes} min · {next.questionIds.length} questions
          </Button>

          <p className="text-ink-faint text-center text-xs">
            {remaining} of {sessions.length} sessions left in this route
          </p>
        </Card>
      ) : (
        <Card className="space-y-2">
          <Eyebrow>Recommended for you</Eyebrow>
          <p className="font-display text-lg font-semibold">
            {route ? "Route complete" : "Nothing packed yet"}
          </p>
          <p className="text-ink-muted text-sm leading-relaxed">
            {route
              ? "You finished every session. Check in and Beacon will pack the next one."
              : "Connect once and Beacon will prepare your next route."}
          </p>
        </Card>
      )}

      {/* ── Or pick a subject ───────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <Eyebrow>Or practise a subject</Eyebrow>
        <div className="grid gap-2.5">
          {SUBJECTS.map((subject) => {
            const meta = SUBJECT_META[subject];
            const stat = stats[subject];
            const accuracy =
              stat.total > 0 ? Math.round((stat.right / stat.total) * 100) : null;
            return (
              <button
                key={subject}
                type="button"
                onClick={() => onPractise(subject)}
                className="border-line bg-surface flex items-center gap-3.5 rounded-2xl
                           border p-4 text-left transition-colors"
              >
                <span
                  aria-hidden
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[15px] font-bold"
                  style={{
                    background: `color-mix(in oklch, ${meta.accent} 18%, var(--surface))`,
                    color: meta.accent,
                  }}
                >
                  {meta.label[0]}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-display text-[15px] font-semibold">
                      {meta.label}
                    </span>
                    {recommendedSubject === subject && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase"
                        style={{
                          background: "var(--surface-2)",
                          color: "var(--amber)",
                        }}
                      >
                        Focus
                      </span>
                    )}
                  </span>
                  <span className="text-ink-faint block text-xs">{meta.blurb}</span>
                </span>

                <span className="shrink-0 text-right">
                  {accuracy === null ? (
                    <span className="text-ink-faint text-xs">New</span>
                  ) : (
                    <>
                      <span className="tabular font-display block text-[15px] font-semibold">
                        {accuracy}%
                      </span>
                      <span className="text-ink-faint block text-[10px]">
                        {stat.total} done
                      </span>
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {pending && (
        <button
          type="button"
          onClick={() => setTab("beacon")}
          className="border-line bg-surface w-full rounded-2xl border p-4 text-left"
        >
          <Eyebrow>Decision Ledger</Eyebrow>
          <p className="mt-1.5 text-sm leading-relaxed">
            Beacon predicted:{" "}
            <span className="font-medium">{pending.prediction}</span>
          </p>
          <p className="text-ink-faint mt-2 text-xs">
            Checking after your next connection →
          </p>
        </button>
      )}
    </div>
  );
}

