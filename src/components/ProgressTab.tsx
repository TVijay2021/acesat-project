"use client";

import { focusAreas, measure, percent, seconds } from "@/lib/agent/analyze";
import { diagnose } from "@/lib/agent/decide";
import { useBeacon } from "@/lib/store";
import { Card, Eyebrow, Meter } from "./ui";

export function ProgressTab() {
  const { attempts, questions, decisions } = useBeacon();
  const areas = focusAreas(attempts, questions).sort(
    (a, b) => b.metrics.accuracy - a.metrics.accuracy
  );
  const overall = measure(attempts);
  const diagnosis = diagnose(attempts, questions, decisions);
  const strongest = areas[0];

  if (!attempts.length) {
    return (
      <Card className="space-y-2">
        <p className="font-display text-lg font-semibold">
          Nothing to chart yet
        </p>
        <p className="text-ink-muted text-sm">
          Finish a session and Beacon will start mapping your strengths.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actionable insight first — the charts are supporting evidence. */}
      <Card className="space-y-4">
        <div>
          <Eyebrow>Your strongest area</Eyebrow>
          <p className="font-display mt-1 text-lg font-semibold">
            {strongest?.label ?? "—"}
          </p>
        </div>
        <div className="border-line border-t pt-3">
          <Eyebrow>Your current bottleneck</Eyebrow>
          <p className="font-display mt-1 text-lg font-semibold">
            {diagnosis
              ? diagnosis.signal === "slow-but-accurate"
                ? `Time management in ${diagnosis.area.label}`
                : diagnosis.area.label
              : "Nothing standing out"}
          </p>
        </div>
        <div className="border-line border-t pt-3">
          <Eyebrow>What Beacon recommends next</Eyebrow>
          <p className="text-ink-muted mt-1 text-sm leading-relaxed">
            {diagnosis
              ? diagnosis.signal === "slow-but-accurate"
                ? "Short timed sets plus skip-and-return practice."
                : "A focused review set with worked explanations."
              : "Keep your current route going."}
          </p>
        </div>
      </Card>

      <Card className="space-y-4">
        <Eyebrow>Accuracy by area</Eyebrow>
        {areas.map((area) => (
          <Meter
            key={area.key}
            label={area.label}
            value={area.metrics.accuracy}
            caption={`${percent(area.metrics.accuracy)}% · ${seconds(area.metrics.medianTimeMs)}s median`}
          />
        ))}
      </Card>

      <Card>
        <div className="flex gap-6">
          <Figure value={String(attempts.length)} label="questions answered" />
          <Figure
            value={`${percent(overall.accuracy)}%`}
            label="overall accuracy"
          />
          <Figure
            value={`${seconds(overall.medianTimeMs)}s`}
            label="median time"
          />
        </div>
      </Card>
    </div>
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
