"use client";

import { useMemo } from "react";
import { buildExamPlan } from "@/lib/examplan";
import { totalMinutes } from "@/lib/exam/format";
import { useBeacon } from "@/lib/store";
import { Button, Card, Eyebrow } from "./ui";

/**
 * The way into a full-length sitting.
 *
 * Deliberately independent of whether a test date is set. This block used to
 * live inside the study-plan card, which meant a student who skipped the date
 * field could not reach a practice test at all — exactly backwards, since a
 * diagnostic is most useful to someone who has not planned yet.
 */
export function PracticeTestCard({ onTakeTest }: { onTakeTest: () => void }) {
  const { profile, attempts, exams } = useBeacon();

  const plan = useMemo(
    () => buildExamPlan(profile.startingPoint, attempts, new Date(), exams),
    [profile.startingPoint, attempts, exams]
  );

  const last = exams[0];
  const schedule = plan?.practiceTests ?? null;
  const due = schedule?.due ?? exams.length === 0;

  return (
    <Card className="space-y-4">
      <div>
        <Eyebrow>Full-length practice test</Eyebrow>
        <h3 className="font-display mt-1 text-lg leading-snug font-semibold">
          {last
            ? `Last sitting: ${last.total}`
            : "Sit a timed test under real conditions"}
        </h3>
        <p className="text-ink-muted mt-1.5 text-sm leading-relaxed">
          {schedule
            ? schedule.reason
            : exams.length === 0
              ? "Two adaptive sections, timed, with a break between them. Beacon uses the result to build everything that follows."
              : "Sit another whenever you want a checkpoint under time."}
        </p>
      </div>

      {last && (
        <div className="border-line flex gap-6 border-t pt-3">
          <Figure value={String(last.readingWriting)} label="Reading & Writing" />
          <Figure value={String(last.math)} label="Math" />
          <Figure
            value={`${last.correct}/${last.questions}`}
            label="correct"
          />
        </div>
      )}

      {due ? (
        <Button onClick={onTakeTest}>
          Start the test · about {totalMinutes()} min
        </Button>
      ) : (
        <Button variant="quiet" onClick={onTakeTest}>
          Sit one early anyway
        </Button>
      )}

      {/* Nobody should start a two-hour sitting without knowing it is one. */}
      <p className="text-ink-faint text-[11px] leading-relaxed">
        Set aside the full time before you start. The timer keeps running and
        leaving a module ends the sitting — the same as test day.
      </p>
    </Card>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="tabular font-display text-lg font-semibold">{value}</p>
      <p className="text-ink-faint text-xs">{label}</p>
    </div>
  );
}
