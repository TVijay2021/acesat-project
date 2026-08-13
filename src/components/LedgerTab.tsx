"use client";

import { useState } from "react";
import { calibrate } from "@/lib/agent/decide";
import { useBeacon } from "@/lib/store";
import type { Decision } from "@/lib/types";
import { Card, Eyebrow } from "./ui";

const OUTCOME_LABEL = {
  confirmed: "Prediction confirmed",
  missed: "Prediction missed",
  pending: "Checking next connection",
} as const;

export function LedgerTab() {
  const { decisions } = useBeacon();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">Decision Ledger</h2>
        <p className="text-ink-muted mt-1 text-sm leading-relaxed">
          Every choice Beacon makes, what it expected to happen, and whether it
          was right.
        </p>
      </div>

      <Learning decisions={decisions} />

      <ol className="relative space-y-3 pl-6">
        {/* The through-line reads as a ship's log rather than a feed. */}
        <span
          aria-hidden
          className="bg-line absolute top-2 bottom-2 left-[7px] w-px"
        />
        {decisions.map((decision) => (
          <li key={decision.id} className="relative">
            <span
              aria-hidden
              className="absolute top-6 -left-[22px] h-[9px] w-[9px] rounded-full"
              style={{
                background:
                  decision.outcome === "confirmed"
                    ? "var(--seafoam)"
                    : decision.outcome === "missed"
                      ? "var(--danger)"
                      : "var(--amber)",
              }}
            />
            <Entry
              decision={decision}
              open={openId === decision.id}
              onToggle={() =>
                setOpenId(openId === decision.id ? null : decision.id)
              }
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function Entry({
  decision,
  open,
  onToggle,
}: {
  decision: Decision;
  open: boolean;
  onToggle: () => void;
}) {
  const tint =
    decision.outcome === "confirmed"
      ? "var(--seafoam)"
      : decision.outcome === "missed"
        ? "var(--danger)"
        : "var(--amber)";

  return (
    <div className="border-line bg-surface rounded-2xl border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full p-5 text-left"
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-base font-semibold">{decision.focus}</p>
          <span className="text-ink-faint shrink-0 text-xs">
            {new Date(decision.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        {/* Outcome is stated in words, never by colour alone. */}
        <p className="mt-2 text-xs font-semibold" style={{ color: tint }}>
          {OUTCOME_LABEL[decision.outcome]}
        </p>
        {decision.outcomeNote && (
          <p className="text-ink-muted mt-1.5 text-sm leading-relaxed">
            {decision.outcomeNote}
          </p>
        )}
        {!open && (
          <p className="text-ink-faint mt-2 text-xs">Show reasoning →</p>
        )}
      </button>

      {open && (
        <div className="border-line space-y-4 border-t p-5">
          {/* OBSERVE → REASON → ACT → PREDICT → CHECK */}
          <Field label="Evidence" value={decision.evidence} />
          <Field label="Action" value={decision.action} />
          <Field label="Prediction" value={decision.prediction} />
          <Field
            label="How Beacon checks this"
            value={
              decision.predictionCheck.metric === "medianTimeMs"
                ? `Median time on ${decision.predictionCheck.scope.domain} must fall by at least ${Math.round(decision.predictionCheck.threshold * 100)}% without accuracy dropping below ${Math.round((decision.predictionCheck.guardAccuracy ?? 0) * 100)}%.`
                : `Accuracy on ${decision.predictionCheck.scope.domain} must rise by at least ${Math.round(decision.predictionCheck.threshold * 100)}%.`
            }
          />
          {decision.outcome !== "pending" && decision.outcomeNote && (
            <Field label="Outcome" value={decision.outcomeNote} />
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <p className="mt-1 text-sm leading-relaxed">{value}</p>
    </div>
  );
}

/**
 * Beacon's self-learning surface. Plain sentences, not a metrics dashboard —
 * the point is that the student can read what Beacon has figured out.
 */
function Learning({ decisions }: { decisions: Decision[] }) {
  const calibration = calibrate(decisions.filter((d) => d.outcome !== "pending"));
  const lines = Object.entries(calibration)
    .filter(([, record]) => record.confirmed + record.missed > 0)
    .map(([kind, record]) => {
      if (record.confirmed > record.missed) {
        return `${sentenceCase(kind)} work has helped ${record.confirmed} ${record.confirmed === 1 ? "time" : "times"}.`;
      }
      if (record.missed > record.confirmed) {
        return `${sentenceCase(kind)} work has had limited impact recently.`;
      }
      return `${sentenceCase(kind)} work has been mixed so far.`;
    });

  if (!lines.length) return null;

  return (
    <Card className="space-y-2">
      <Eyebrow>Beacon is learning your patterns</Eyebrow>
      <ul className="space-y-1.5">
        {lines.map((line) => (
          <li key={line} className="text-sm leading-relaxed">
            {line}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
