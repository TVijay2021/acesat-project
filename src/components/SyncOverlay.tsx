"use client";

import { useBeacon } from "@/lib/store";
import { SYNC_STAGES } from "@/lib/sync";
import { Button, Eyebrow } from "./ui";

export function SyncOverlay() {
  const { sync, dismissSync } = useBeacon();
  if (sync.status === "idle") return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center sm:justify-center"
      style={{ background: "var(--overlay)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Beacon check-in"
    >
      <div className="border-line bg-surface w-full rounded-t-3xl border-t p-6 sm:max-w-md sm:rounded-3xl sm:border">
        {sync.status === "running" && <Running stage={sync.stage} />}
        {sync.status === "done" && (
          <Done summary={sync.summary} onClose={dismissSync} />
        )}
        {sync.status === "failed" && <Failed onClose={dismissSync} />}
      </div>
    </div>
  );
}

function Running({ stage }: { stage: number }) {
  return (
    <div className="space-y-6">
      <Beam />
      <div>
        <Eyebrow>Beacon is checking in</Eyebrow>
        <ol className="mt-3 space-y-2.5">
          {SYNC_STAGES.map((label, index) => {
            const done = index < stage;
            const active = index === stage;
            return (
              <li
                key={label}
                className="flex items-center gap-3 text-[15px]"
                style={{
                  color: active
                    ? "var(--text)"
                    : done
                      ? "var(--text-muted)"
                      : "var(--text-faint)",
                }}
                aria-current={active ? "step" : undefined}
              >
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    background:
                      done || active ? "var(--amber)" : "var(--border-strong)",
                  }}
                />
                {label}
                {done && <span className="sr-only"> — complete</span>}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/**
 * The lighthouse beam sweeping while Beacon works. CSS keyframes only, and
 * disabled entirely under prefers-reduced-motion by the global rule.
 */
function Beam() {
  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 120 80" className="h-24 w-40" aria-hidden>
        <defs>
          <linearGradient id="sweep" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g style={{ transformOrigin: "26px 34px", animation: "sweep 2.6s ease-in-out infinite" }}>
          <polygon points="26,34 120,10 120,58" fill="url(#sweep)" />
        </g>
        <polygon points="20,34 32,34 26,26" fill="var(--text)" />
        <rect
          x="20"
          y="34"
          width="12"
          height="8"
          fill="var(--surface-2)"
          stroke="var(--text)"
          strokeWidth="0.8"
        />
        <circle
          cx="26"
          cy="38"
          r="2"
          fill="var(--amber)"
          style={{ animation: "pulse 2.6s ease-in-out infinite" }}
        />
        <polygon points="18,70 34,70 31,42 21,42" fill="var(--text)" />
      </svg>
      <style>{`
        @keyframes sweep {
          0%, 100% { transform: rotate(-14deg); }
          50% { transform: rotate(14deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function Done({
  summary,
  onClose,
}: {
  summary: import("@/lib/sync").SyncSummary;
  onClose: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>Check-in complete</Eyebrow>
        <h2 className="font-display mt-1 text-xl font-semibold">
          Your next route is ready.
        </h2>
      </div>

      {summary.graded.length > 0 && (
        <div className="space-y-3">
          {summary.graded.map((grade) => (
            <div
              key={grade.focus + grade.note}
              className="rounded-xl p-4"
              style={{
                background: "var(--surface-2)",
                borderLeft: `3px solid ${grade.outcome === "confirmed" ? "var(--seafoam)" : "var(--danger)"}`,
              }}
            >
              <p
                className="text-xs font-semibold"
                style={{
                  color:
                    grade.outcome === "confirmed"
                      ? "var(--seafoam)"
                      : "var(--danger)",
                }}
              >
                {grade.outcome === "confirmed"
                  ? "Prediction confirmed"
                  : "Prediction missed"}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed">{grade.note}</p>
            </div>
          ))}
        </div>
      )}

      {summary.newFocus && (
        <div>
          <Eyebrow>New focus</Eyebrow>
          <p className="font-display mt-1 text-lg font-semibold">
            {summary.newFocus}
          </p>
          <p className="text-ink-muted mt-1 text-sm">
            {summary.sessionsPacked} sessions packed and ready offline.
          </p>
        </div>
      )}

      <Button onClick={onClose}>Continue</Button>

      {/* Honest about which parts a model touched. */}
      <p className="text-ink-faint text-center text-[11px]">
        {summary.authored
          ? "Explanations written by Claude · decisions and grading computed locally"
          : "Running without an API key · using Beacon's own copy"}
      </p>
    </div>
  );
}

function Failed({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>Check-in</Eyebrow>
        <h2 className="font-display mt-1 text-xl font-semibold">
          Beacon couldn&rsquo;t check in yet
        </h2>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          Your offline progress is safe. We&rsquo;ll try again next time
          you&rsquo;re connected.
        </p>
      </div>
      <Button onClick={onClose} variant="quiet">
        Keep training offline
      </Button>
    </div>
  );
}
