"use client";

import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { CoachingSheet } from "@/components/CoachingSheet";
import { ExamRunner } from "@/components/ExamRunner";
import { HomeTab } from "@/components/HomeTab";
import { LedgerTab } from "@/components/LedgerTab";
import { Lighthouse } from "@/components/Lighthouse";
import { Onboarding } from "@/components/Onboarding";
import { ProgressTab } from "@/components/ProgressTab";
import { QuestionRunner } from "@/components/QuestionRunner";
import { ReviewTab } from "@/components/ReviewTab";
import { SyncOverlay } from "@/components/SyncOverlay";
import { TrainTab } from "@/components/TrainTab";
import { Button } from "@/components/ui";
import { buildPracticeSession } from "@/lib/practice";
import { BeaconProvider, useBeacon } from "@/lib/store";
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
    profile,
    setPreferences,
  } = useBeacon();

  // One slot for whatever is being worked on, whether that is a packed block,
  // a block trimmed to fit the time available, or a subject the student chose.
  const [activeSession, setActiveSession] = useState<TrainingSession | null>(null);
  const [examOpen, setExamOpen] = useState(false);
  const [coachingOpen, setCoachingOpen] = useState(false);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Lighthouse className="h-10 w-10 opacity-60" />
        <span className="sr-only">Loading Beacon</span>
      </div>
    );
  }

  if (!profile.onboarded) return <Onboarding />;

  function startPractice(subject: Subject) {
    const built = buildPracticeSession(
      subject,
      [...questions.values()],
      attempts
    );
    if (built) setActiveSession(built);
  }

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
              onStartSession={setActiveSession}
              onTakeTest={() => setExamOpen(true)}
              onPractise={startPractice}
              onOpenCoaching={() => setCoachingOpen(true)}
            />
          )}
          {tab === "train" && (
            <TrainTab
              onStart={(id) =>
                setActiveSession(sessions.find((s) => s.id === id) ?? null)
              }
            />
          )}
          {tab === "review" && <ReviewTab />}
          {tab === "progress" && <ProgressTab />}
          {tab === "beacon" && <LedgerTab />}
        </main>
      </div>

      <BottomNav />

      {activeSession && (
        <QuestionRunner
          key={activeSession.id}
          session={activeSession}
          onExit={() => setActiveSession(null)}
        />
      )}

      {coachingOpen && (
        <div className="bg-bg fixed inset-0 z-30 overflow-y-auto">
          <div className="mx-auto max-w-md space-y-6 px-5 pt-6 pb-16">
            <div className="space-y-1.5">
              <h2 className="font-display text-xl font-semibold">
                How Beacon talks to you
              </h2>
              <p className="text-ink-muted text-sm leading-relaxed">
                This shapes the notes Beacon writes after a missed question.
              </p>
            </div>
            <CoachingSheet
              preferences={profile.preferences}
              onChange={setPreferences}
            />
            <Button onClick={() => setCoachingOpen(false)}>Done</Button>
          </div>
        </div>
      )}

      {examOpen && <ExamRunner onExit={() => setExamOpen(false)} />}

      <SyncOverlay />
    </div>
  );
}
