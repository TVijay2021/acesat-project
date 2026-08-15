"use client";

import { useMemo } from "react";
import { analyseCalibration } from "@/lib/agent/calibration";
import { percent } from "@/lib/agent/analyze";
import { useBeacon } from "@/lib/store";
import { Card, Eyebrow } from "./ui";

/**
 * Shows the gap between what the student thought they knew and what they got
 * right. Every figure here comes from confidence ratings already captured
 * after each question, so nothing extra is asked of the student.
 */
export function CalibrationCard({ compact = false }: { compact?: boolean }) {
  const { attempts, questions } = useBeacon();
  const report = useMemo(
    () => analyseCalibration(attempts, questions),
    [attempts, questions]
  );

  if (report.verdict === "insufficient" && compact) return null;

  return (
    <Card className="space-y-4">
      <div>
        <Eyebrow>Confidence check</Eyebrow>
        <h3 className="font-display mt-1 text-lg leading-snug font-semibold">
          {report.headline}
        </h3>
        <p className="text-ink-muted mt-1.5 text-sm leading-relaxed">
          {report.detail}
        </p>
      </div>

      {report.verdict !== "insufficient" && (
        <>
          <ul className="space-y-2.5">
            {report.bands
              .filter((band) => band.count > 0)
              .map((band) => (
                <li key={band.level} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">
                      Said &ldquo;{band.label}&rdquo;
                    </span>
                    {/* The numbers carry the meaning; the bar only echoes it. */}
                    <span className="tabular text-ink-muted">
                      {band.correct} of {band.count} right ·{" "}
                      {percent(band.accuracy)}%
                    </span>
                  </div>
                  <div
                    className="bg-surface-2 h-1.5 overflow-hidden rounded-full"
                    role="img"
                    aria-label={`Said ${band.label}: ${band.correct} of ${band.count} correct`}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round(band.accuracy * 100)}%`,
                        background:
                          band.level === "sure"
                            ? "var(--amber)"
                            : "var(--seafoam)",
                      }}
                    />
                  </div>
                </li>
              ))}
          </ul>

          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--surface-2)",
              borderLeft: "3px solid var(--amber)",
            }}
          >
            <p className="text-sm leading-relaxed">{report.advice}</p>
          </div>
        </>
      )}

      {report.verdict === "insufficient" && (
        <p className="text-ink-faint text-xs leading-relaxed">
          {report.advice}
        </p>
      )}
    </Card>
  );
}
