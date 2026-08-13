"use client";

import { useBeacon } from "@/lib/store";
import { Card, Eyebrow } from "./ui";

export function TrainTab({ onStart }: { onStart: (sessionId: string) => void }) {
  const { sessions, online } = useBeacon();

  if (!sessions.length) {
    return (
      <Card className="space-y-2">
        <p className="font-display text-lg font-semibold">No sessions packed</p>
        <p className="text-ink-muted text-sm">
          Connect briefly and Beacon will prepare your training.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Eyebrow>Your route</Eyebrow>
        <span className="text-ink-faint text-xs">
          {online ? "Synced" : "Available offline"}
        </span>
      </div>

      <ul className="space-y-3">
        {sessions.map((session) => {
          const done = session.completedAt !== null;
          return (
            <li key={session.id}>
              <button
                type="button"
                onClick={() => onStart(session.id)}
                className="border-line bg-surface flex w-full items-start gap-4 rounded-2xl
                           border p-5 text-left"
              >
                <span
                  aria-hidden
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center
                             rounded-full text-xs font-semibold"
                  style={{
                    background: done ? "var(--amber)" : "var(--surface-2)",
                    color: done ? "var(--bg-deep)" : "var(--text-faint)",
                  }}
                >
                  {done ? "✓" : session.day + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-base font-semibold">
                      {session.title}
                    </span>
                    <span className="tabular text-ink-faint shrink-0 text-xs">
                      {session.estimatedMinutes} min
                    </span>
                  </span>
                  <span className="text-ink-muted mt-1 block text-sm leading-relaxed">
                    {session.intent}
                  </span>
                  {done && (
                    <span className="text-ink-faint mt-1.5 block text-xs">
                      Completed · results saved for the next check-in
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
