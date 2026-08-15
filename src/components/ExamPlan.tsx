"use client";

import { useMemo, useState } from "react";
import { buildExamPlan, milestones } from "@/lib/examplan";
import { useBeacon } from "@/lib/store";
import { Button, Card, Eyebrow } from "./ui";

/**
 * The countdown and study path toward a booked test date.
 *
 * Renders a prompt instead of a plan when no date is set — an invented
 * schedule is worse than asking for the one fact it needs.
 */
export function ExamPlan() {
  const { profile, attempts } = useBeacon();
  const [editing, setEditing] = useState(false);

  const plan = useMemo(
    () => buildExamPlan(profile.startingPoint, attempts),
    [profile.startingPoint, attempts]
  );

  if (!plan || editing) {
    return <DatePrompt onDone={() => setEditing(false)} hasPlan={plan !== null} />;
  }

  const steps = milestones(plan);

  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow>Test day</Eyebrow>
          <p className="font-display mt-1 text-xl font-semibold">
            {plan.testDate.toLocaleDateString(undefined, {
              weekday: "short",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="tabular font-display text-2xl leading-none font-semibold">
            {Math.max(plan.daysLeft, 0)}
          </p>
          <p className="text-ink-faint text-xs">
            {plan.daysLeft === 1 ? "day left" : "days left"}
          </p>
        </div>
      </div>

      <div className="border-line border-t pt-4">
        <Eyebrow>You are here</Eyebrow>
        <p className="font-display mt-1 text-lg font-semibold">
          {plan.phase.label}
        </p>
        <p className="text-ink-muted mt-1 text-sm leading-relaxed">
          {plan.phase.focus}
        </p>
        {plan.nextPhase && plan.daysToNextPhase !== null && (
          <p className="text-ink-faint mt-2 text-xs">
            {plan.nextPhase.label} starts in {plan.daysToNextPhase}{" "}
            {plan.daysToNextPhase === 1 ? "day" : "days"}.
          </p>
        )}
      </div>

      {/* The path, as a route rather than a chart. */}
      <ol className="space-y-2">
        {steps.map(({ spec, state }) => (
          <li key={spec.id} className="flex items-center gap-3">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{
                background:
                  state === "current"
                    ? "var(--amber)"
                    : state === "done"
                      ? "var(--seafoam)"
                      : "var(--border-strong)",
              }}
            />
            <span
              className="text-sm"
              style={{
                color:
                  state === "current" ? "var(--text)" : "var(--text-faint)",
                fontWeight: state === "current" ? 600 : 400,
              }}
            >
              {spec.label}
            </span>
            {state === "current" && (
              <span className="text-ink-faint text-xs">now</span>
            )}
          </li>
        ))}
      </ol>

      <div className="border-line space-y-3 border-t pt-4">
        <Eyebrow>Your pace</Eyebrow>
        <div className="flex gap-6">
          <Figure
            value={`${plan.sessionsThisWeek}/${plan.sessionsPerWeek}`}
            label="sessions this week"
          />
          {plan.pointsNeeded !== null && plan.pointsNeeded > 0 && (
            <Figure value={`+${plan.pointsNeeded}`} label="points to target" />
          )}
        </div>
        {/* State in words, not by colour alone. */}
        <p
          className="text-sm font-medium"
          style={{ color: plan.onPace ? "var(--seafoam)" : "var(--amber)" }}
        >
          {plan.onPace
            ? "On pace this week."
            : `${plan.sessionsPerWeek - plan.sessionsThisWeek} more ${
                plan.sessionsPerWeek - plan.sessionsThisWeek === 1
                  ? "session"
                  : "sessions"
              } to stay on pace.`}
        </p>
        <p className="text-ink-muted text-sm leading-relaxed">{plan.verdict}</p>
        {/* The estimate rests on an assumption, so name it. */}
        <p className="text-ink-faint text-[11px] leading-relaxed">
          Pacing assumes roughly 1.5 points per focused session, based on
          published SAT practice research. It is a planning estimate, not a
          prediction.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-ink-muted min-h-9 text-[13px] font-semibold underline underline-offset-4"
      >
        Change test date or target
      </button>
    </Card>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="tabular font-display text-xl font-semibold">{value}</p>
      <p className="text-ink-faint text-xs">{label}</p>
    </div>
  );
}

function DatePrompt({
  onDone,
  hasPlan,
}: {
  onDone: () => void;
  hasPlan: boolean;
}) {
  const { profile, setStartingPoint } = useBeacon();
  const existing = profile.startingPoint;
  const [testDate, setTestDate] = useState(existing?.testDate ?? "");
  const [target, setTarget] = useState(
    existing?.targetScore ? String(existing.targetScore) : ""
  );
  const [current, setCurrent] = useState(
    existing?.total ? String(existing.total) : ""
  );

  function save() {
    setStartingPoint({
      total: current ? Number(current) : (existing?.total ?? null),
      math: existing?.math ?? null,
      readingWriting: existing?.readingWriting ?? null,
      testDate: testDate || null,
      targetScore: target ? Number(target) : (existing?.targetScore ?? null),
      recordedAt: Date.now(),
    });
    onDone();
  }

  return (
    <Card className="space-y-4">
      <div>
        <Eyebrow>Plan for your test date</Eyebrow>
        <p className="text-ink-muted mt-1.5 text-sm leading-relaxed">
          Tell Beacon when you sit the SAT and it will pace your route to get
          you there.
        </p>
      </div>

      <Field label="Test date">
        <input
          type="date"
          value={testDate}
          onChange={(e) => setTestDate(e.target.value)}
          className="border-line bg-surface min-h-12 w-full rounded-xl border px-4 text-[15px]"
        />
      </Field>

      <div className="flex gap-3">
        <Field label="Current score">
          <input
            type="number"
            inputMode="numeric"
            placeholder="1200"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="border-line bg-surface min-h-12 w-full rounded-xl border px-4 text-[15px]"
          />
        </Field>
        <Field label="Target score">
          <input
            type="number"
            inputMode="numeric"
            placeholder="1400"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="border-line bg-surface min-h-12 w-full rounded-xl border px-4 text-[15px]"
          />
        </Field>
      </div>

      <Button onClick={save} disabled={!testDate}>
        {hasPlan ? "Update plan" : "Build my plan"}
      </Button>
      {hasPlan && (
        <button
          type="button"
          onClick={onDone}
          className="text-ink-faint min-h-9 w-full text-[13px]"
        >
          Cancel
        </button>
      )}
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block flex-1 space-y-1.5">
      <span className="text-ink-muted text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}
