"use client";

import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { HomeTab } from "@/components/HomeTab";
import { LedgerTab } from "@/components/LedgerTab";
import { Lighthouse } from "@/components/Lighthouse";
import { ProgressTab } from "@/components/ProgressTab";
import { QuestionRunner } from "@/components/QuestionRunner";
import { SyncOverlay } from "@/components/SyncOverlay";
import { TrainTab } from "@/components/TrainTab";
import { ReviewTab } from "@/components/ReviewTab";
import { BeaconProvider, nextSessionOf, useBeacon } from "@/lib/store";
import { buildPracticeSession } from "@/lib/practice";
import type { Subject } from "@/lib/subjects";
import type { TrainingSession } from "@/lib/types";

export default function Page() {
  return (
    <BeaconProvider>
      <App />
    </BeaconProvider>
  );
}

function App() {
  const {
    ready,
    tab,
    sessions,
    online,
    simulateOffline,
    setSimulateOffline,
    questions,
    attempts,
  } = useBeacon();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  // A subject the student picked themselves. Built on the fly and never
  // persisted, so it sits outside the packed route without disturbing it.
  const [practice, setPractice] = useState<TrainingSession | null>(null);

  function startPractice(subject: Subject) {
    const built = buildPracticeSession(
      subject,
      [...questions.values()],
      attempts
    );
    if (built) setPractice(built);
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Lighthouse className="h-10 w-10 opacity-60" />
        <span className="sr-only">Loading Beacon</span>
      </div>
    );
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  return (
    <div className="flex min-h-dvh flex-col sm:flex-col-reverse">
      <div className="flex-1">
        <header className="mx-auto flex max-w-2xl items-center justify-between px-5 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <Lighthouse className="h-5 w-5" beam={online} />
            <span className="font-display text-base font-semibold">Beacon</span>
          </div>
          {/* Demo control: a judge can watch the app work with the radio off
              without leaving the browser. */}
          <button
            type="button"
            onClick={() => setSimulateOffline(!simulateOffline)}
            className="border-line text-ink-muted min-h-9 rounded-lg border px-3 text-xs font-semibold"
          >
            {simulateOffline ? "Go online" : "Simulate offline"}
          </button>
        </header>

        <main className="mx-auto max-w-2xl px-5 pb-8">
          {tab === "home" && (
            <HomeTab
              onStart={() => {
                const next = nextSessionOf(sessions);
                if (next) setActiveSessionId(next.id);
              }}
              onPractise={startPractice}
            />
          )}
          {tab === "train" && <TrainTab onStart={setActiveSessionId} />}
          {tab === "review" && <ReviewTab />}
          {tab === "progress" && <ProgressTab />}
          {tab === "beacon" && <LedgerTab />}
        </main>
      </div>

      <BottomNav />

      {activeSession && (
        <QuestionRunner
          session={activeSession}
          onExit={() => setActiveSessionId(null)}
        />
      )}

      {practice && (
        <QuestionRunner
          key={practice.id}
          session={practice}
          onExit={() => setPractice(null)}
        />
      )}

      <SyncOverlay />
    </div>
  );
}
