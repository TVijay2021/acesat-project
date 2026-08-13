"use client";

import { useMemo, useState } from "react";
import { useBeacon } from "@/lib/store";
import { subjectOf, SUBJECT_META, SUBJECTS, type Subject } from "@/lib/subjects";
import type { Attempt, MistakeReason, Question } from "@/lib/types";
import { Card, Eyebrow } from "./ui";

const REASON_LABEL: Record<MistakeReason, string> = {
  concept: "Didn't know the concept",
  misread: "Misread the question",
  rushed: "Rushed",
  overthought: "Overthought it",
  "wrong-strategy": "Wrong strategy",
  careless: "Careless mistake",
};

interface Entry {
  attempt: Attempt;
  question: Question;
  subject: Subject;
}

/**
 * The mistake log, and the reason the rest of the app exists.
 *
 * Every wrong answer keeps the question, what the student put, what was right,
 * why they think it went wrong, and the note they wrote to themselves. The
 * night before the test this is the only screen worth opening.
 */
export function ReviewTab() {
  const { attempts, questions } = useBeacon();
  const [filter, setFilter] = useState<Subject | "all">("all");
  const [openId, setOpenId] = useState<number | null>(null);

  const entries = useMemo<Entry[]>(() => {
    return attempts
      .filter((a) => !a.correct)
      .map((attempt) => {
        const question = questions.get(attempt.questionId);
        if (!question) return null;
        return {
          attempt,
          question,
          subject: subjectOf(question.domain),
        };
      })
      .filter((entry): entry is Entry => entry !== null)
      .sort((a, b) => b.attempt.answeredAt - a.attempt.answeredAt);
  }, [attempts, questions]);

  const shown = entries.filter((e) => filter === "all" || e.subject === filter);

  // What keeps going wrong, rather than what went wrong once.
  const patterns = useMemo(() => {
    const bySkill = new Map<string, number>();
    const byReason = new Map<MistakeReason, number>();
    for (const entry of shown) {
      bySkill.set(entry.question.skill, (bySkill.get(entry.question.skill) ?? 0) + 1);
      if (entry.attempt.mistakeReason) {
        byReason.set(
          entry.attempt.mistakeReason,
          (byReason.get(entry.attempt.mistakeReason) ?? 0) + 1
        );
      }
    }
    return {
      skills: [...bySkill.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
      reasons: [...byReason.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2),
    };
  }, [shown]);

  if (entries.length === 0) {
    return (
      <Card className="space-y-2">
        <p className="font-display text-lg font-semibold">Nothing to review yet</p>
        <p className="text-ink-muted text-sm leading-relaxed">
          Every question you miss lands here — with what you picked, what was
          right, and the note you wrote about why. This is your cram sheet.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="All"
          count={entries.length}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {SUBJECTS.map((subject) => (
          <FilterChip
            key={subject}
            label={SUBJECT_META[subject].label}
            count={entries.filter((e) => e.subject === subject).length}
            active={filter === subject}
            onClick={() => setFilter(subject)}
          />
        ))}
      </div>

      {patterns.skills.length > 0 && (
        <Card className="space-y-3">
          <Eyebrow>What keeps catching you</Eyebrow>
          <ul className="space-y-1.5">
            {patterns.skills.map(([skill, count]) => (
              <li key={skill} className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{skill}</span>
                <span className="tabular text-ink-muted shrink-0 text-sm">
                  {count} {count === 1 ? "miss" : "misses"}
                </span>
              </li>
            ))}
          </ul>
          {patterns.reasons.length > 0 && (
            <p className="text-ink-muted border-line border-t pt-3 text-sm leading-relaxed">
              Most often because you{" "}
              <span className="font-medium">
                {REASON_LABEL[patterns.reasons[0][0]].toLowerCase()}
              </span>
              {patterns.reasons[1] && (
                <>
                  , then{" "}
                  <span className="font-medium">
                    {REASON_LABEL[patterns.reasons[1][0]].toLowerCase()}
                  </span>
                </>
              )}
              .
            </p>
          )}
        </Card>
      )}

      {shown.length === 0 ? (
        <Card>
          <p className="text-ink-muted text-sm">
            No {filter === "all" ? "" : SUBJECT_META[filter as Subject].label}{" "}
            mistakes logged yet.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {shown.map((entry) => (
            <li key={entry.attempt.id}>
              <EntryCard
                entry={entry}
                open={openId === entry.attempt.id}
                onToggle={() =>
                  setOpenId(
                    openId === entry.attempt.id ? null : (entry.attempt.id ?? null)
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EntryCard({
  entry,
  open,
  onToggle,
}: {
  entry: Entry;
  open: boolean;
  onToggle: () => void;
}) {
  const { attempt, question, subject } = entry;
  const meta = SUBJECT_META[subject];
  const yours =
    question.choices.find((c) => c.label === attempt.response)?.text ??
    attempt.response ??
    "—";
  const right =
    question.choices.find((c) => c.label === question.answer)?.text ??
    question.answer;

  // Collapsed by default: a cram sheet is scanned, not read.
  const preview = question.stem.replace(/\s+/g, " ").trim();

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase"
              style={{
                background: "var(--surface-2)",
                color: meta.accent,
              }}
            >
              {meta.label}
            </span>
            <span className="text-ink-faint text-xs">{question.skill}</span>
          </div>
        </div>
        <span className="text-ink-faint shrink-0 text-xs">
          {formatDay(attempt.answeredAt)}
        </span>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full text-left"
      >
        <p
          className={`text-sm leading-relaxed ${open ? "" : "line-clamp-2"}`}
          style={open ? { whiteSpace: "pre-line" } : undefined}
        >
          {open ? question.stem : preview}
        </p>
        <span className="text-ink-faint mt-1 inline-block text-xs">
          {open ? "Show less" : "Show question"}
        </span>
      </button>

      <div className="grid grid-cols-2 gap-2">
        <AnswerBox label="You put" text={yours} tone="danger" />
        <AnswerBox label="Correct" text={right} tone="seafoam" />
      </div>

      {attempt.mistakeReason && (
        <p className="text-ink-muted text-sm">
          <span className="text-ink-faint">Why: </span>
          {REASON_LABEL[attempt.mistakeReason]}
        </p>
      )}

      {attempt.note && (
        <div
          className="rounded-lg px-3 py-2.5"
          style={{
            background: "var(--surface-2)",
            borderLeft: "3px solid var(--amber)",
          }}
        >
          <Eyebrow>Future tip</Eyebrow>
          <p className="mt-1 text-sm leading-relaxed">{attempt.note}</p>
        </div>
      )}
    </Card>
  );
}

function AnswerBox({
  label,
  text,
  tone,
}: {
  label: string;
  text: string;
  tone: "danger" | "seafoam";
}) {
  const colour = tone === "danger" ? "var(--danger)" : "var(--seafoam)";
  return (
    <div
      className="min-w-0 rounded-lg p-2.5"
      style={{ background: `color-mix(in oklch, ${colour} 10%, var(--surface))` }}
    >
      <p
        className="text-[10px] font-semibold tracking-wide uppercase"
        style={{ color: colour }}
      >
        {label}
      </p>
      <p className="mt-0.5 text-[13px] leading-snug break-words">{text}</p>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="border-line min-h-9 rounded-full border px-3.5 text-[13px] font-semibold"
      style={{
        background: active ? "var(--amber)" : "var(--surface)",
        color: active ? "var(--bg-deep)" : "var(--text-muted)",
        borderColor: active ? "var(--amber)" : "var(--border)",
      }}
    >
      {label}
      <span className="tabular ml-1.5 opacity-70">{count}</span>
    </button>
  );
}

function formatDay(timestamp: number): string {
  const then = new Date(timestamp);
  const now = new Date();
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(then)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
