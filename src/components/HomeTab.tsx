"use client";

import { nextSessionOf, useBeacon } from "@/lib/store";
import { Button, Card, Eyebrow } from "./ui";
import { RouteChart } from "./RouteChart";

export function HomeTab({ onStart }: { onStart: () => void }) {
  const { online, route, sessions, decisions, attempts, setTab, startSync } =
    useBeacon();
  const next = nextSessionOf(sessions);
  const remaining = sessions.filter((s) => s.completedAt === null).length;
  const pending = decisions.find((d) => d.outcome === "pending");
  const unsynced = attempts.filter((a) => !a.synced).length;

  return (
    <div className="space-y-4">
      {/* Connectivity is the first thing the student sees, and offline is
          stated as a capability rather than a failure. */}
      <Card className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: online ? "var(--seafoam)" : "var(--amber)" }}
            />
            <p className="text-[15px] font-semibold">
              {online ? "Beacon connected" : "You're offline"}
            </p>
          </div>
          <p className="text-ink-muted text-sm">
            {online
              ? remaining > 0
                ? "Your next training route is ready."
                : "Route complete. Beacon will pack a new one."
              : `${remaining} training ${remaining === 1 ? "session is" : "sessions are"} ready to go.`}
          </p>
        </div>

        {online ? (
          <Button variant="quiet" onClick={startSync}>
            {unsynced > 0
              ? `Check in with Beacon · ${unsynced} new`
              : "Check in with Beacon"}
          </Button>
        ) : (
          unsynced > 0 && (
            <p className="text-ink-faint text-xs">
              {unsynced} answered {unsynced === 1 ? "question" : "questions"}{" "}
              saved. Beacon will review {unsynced === 1 ? "it" : "them"} on your
              next connection.
            </p>
          )
        )}
      </Card>

      {route ? (
        <>
          <Card className="space-y-4">
            <RouteChart sessions={sessions} focus={route.primaryFocus} />
            <div className="space-y-3">
              <div>
                <Eyebrow>Primary focus</Eyebrow>
                <h2 className="font-display mt-1 text-xl font-semibold">
                  {route.primaryFocus}
                </h2>
              </div>
              <div>
                <Eyebrow>Why</Eyebrow>
                <p className="text-ink-muted mt-1 text-sm leading-relaxed">
                  {route.rationale}
                </p>
              </div>
              <div className="border-line flex gap-6 border-t pt-3">
                <Stat value={String(remaining)} label="sessions left" />
                <Stat
                  value={`${sessions.reduce((sum, s) => (s.completedAt ? sum : sum + s.estimatedMinutes), 0)}m`}
                  label="est. time"
                />
                <Stat value={String(route.days)} label="days packed" />
              </div>
            </div>
          </Card>

          {next ? (
            <Card className="space-y-3">
              <Eyebrow>Next up</Eyebrow>
              <div>
                <p className="font-display text-lg font-semibold">{next.title}</p>
                <p className="text-ink-muted text-sm">{next.intent}</p>
              </div>
              <Button onClick={onStart}>
                Start training · {next.estimatedMinutes} min
              </Button>
            </Card>
          ) : (
            <Card>
              <p className="text-sm">
                You finished every session in this route. Reconnect and Beacon
                will review your results.
              </p>
            </Card>
          )}
        </>
      ) : (
        <Card className="space-y-2">
          <p className="font-display text-lg font-semibold">Nothing packed yet</p>
          <p className="text-ink-muted text-sm">
            Connect once and Beacon will prepare your next route.
          </p>
        </Card>
      )}

      {pending && (
        <button
          type="button"
          onClick={() => setTab("beacon")}
          className="border-line bg-surface w-full rounded-2xl border p-5 text-left"
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="tabular font-display text-lg font-semibold">{value}</p>
      <p className="text-ink-faint text-xs">{label}</p>
    </div>
  );
}
