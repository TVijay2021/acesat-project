"use client";

import type { ExamRecord } from "@/lib/types";
import { Button, Eyebrow } from "./ui";

/**
 * The score report. Leads with the number a student came for, then spends most
 * of its space on what to do next — a score with no action attached is just
 * anxiety.
 */
export function ExamReport({
  record,
  onDone,
}: {
  record: ExamRecord;
  onDone: () => void;
}) {
  const shortForm = record.scale < 0.95;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Eyebrow>Practice test complete</Eyebrow>
        <p className="tabular font-display mt-2 text-5xl font-semibold">
          {record.total}
        </p>
        <p className="text-ink-faint mt-1 text-xs">out of 1600, estimated</p>
      </div>

      <div className="flex gap-3">
        <ScoreTile label="Reading & Writing" value={record.readingWriting} />
        <ScoreTile label="Math" value={record.math} />
      </div>

      <div className="border-line flex gap-6 border-t pt-4">
        <Figure
          value={`${record.correct}/${record.questions}`}
          label="correct"
        />
        <Figure
          value={`${record.questions - record.answered}`}
          label="left blank"
        />
      </div>

      {record.findings.length > 0 && (
        <div className="space-y-3">
          <Eyebrow>What cost you marks</Eyebrow>
          <ul className="space-y-2.5">
            {record.findings.map((finding) => (
              <li
                key={finding}
                className="rounded-xl p-4 text-sm leading-relaxed"
                style={{
                  background: "var(--surface-2)",
                  borderLeft: "3px solid var(--amber)",
                }}
              >
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <Eyebrow>What Beacon does next</Eyebrow>
        <p className="mt-1.5 text-sm leading-relaxed">{record.recommendation}</p>
      </div>

      {/* An estimated score presented as an official one would mislead. */}
      <p className="text-ink-faint text-[11px] leading-relaxed">
        {shortForm
          ? `This was a shortened sitting (${record.questions} questions rather than 98), so the score is a rough indication only. `
          : ""}
        Scores are estimated from your raw marks. College Board equates each real
        test with a table it does not publish, so treat this as a direction of
        travel, not a predicted score.
      </p>

      <Button onClick={onDone}>Back to Beacon</Button>
    </div>
  );
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-line bg-surface flex-1 rounded-2xl border p-4">
      <p className="tabular font-display text-2xl font-semibold">{value}</p>
      <p className="text-ink-faint mt-0.5 text-xs">{label}</p>
    </div>
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
