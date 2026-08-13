"use client";

import { useState } from "react";
import { DEFAULT_PREFERENCES } from "@/lib/profile";
import { useBeacon } from "@/lib/store";
import type { CoachingPreferences, StartingPoint } from "@/lib/types";
import { CoachingSheet } from "./CoachingSheet";
import { Lighthouse } from "./Lighthouse";
import { Button, Eyebrow } from "./ui";

type Step = "start" | "voice";

/**
 * First run. Two short steps, both skippable.
 *
 * The scores are a bearing, not a grade — nothing here is required, and the
 * copy never asks the student to account for where they are today.
 */
export function Onboarding() {
  const { profile, setStartingPoint, setPreferences, completeOnboarding } =
    useBeacon();
  const [step, setStep] = useState<Step>("start");
  const [preferences, setLocalPreferences] = useState<CoachingPreferences>(
    profile.preferences ?? DEFAULT_PREFERENCES
  );

  const [total, setTotal] = useState("");
  const [math, setMath] = useState("");
  const [reading, setReading] = useState("");
  const [testDate, setTestDate] = useState("");
  const [target, setTarget] = useState("");

  function saveStart() {
    const parsed: StartingPoint = {
      total: toScore(total),
      math: toScore(math),
      readingWriting: toScore(reading),
      testDate: testDate || null,
      targetScore: toScore(target),
      recordedAt: Date.now(),
    };
    const anything =
      parsed.total !== null ||
      parsed.math !== null ||
      parsed.readingWriting !== null ||
      parsed.testDate !== null ||
      parsed.targetScore !== null;
    setStartingPoint(anything ? parsed : null);
    setStep("voice");
  }

  function finish() {
    setPreferences(preferences);
    completeOnboarding();
  }

  return (
    <div className="bg-bg fixed inset-0 z-40 overflow-y-auto">
      <div className="mx-auto flex min-h-full max-w-md flex-col px-6 py-10">
        <div className="mb-8 flex items-center gap-2.5">
          <Lighthouse className="h-6 w-6" beam />
          <span className="font-display text-lg font-semibold">Beacon</span>
        </div>

        {step === "start" ? (
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <Eyebrow>Your starting point</Eyebrow>
              <h1 className="font-display text-[26px] leading-tight font-semibold">
                Where are you setting out from?
              </h1>
              <p className="text-ink-muted text-sm leading-relaxed">
                If you&rsquo;ve taken an SAT before, these give Beacon a bearing
                to steer by. Every field is optional — you can skip the lot and
                Beacon will work it out from your practice.
              </p>
            </div>

            <div className="space-y-3">
              <Field
                label="Total score"
                value={total}
                onChange={setTotal}
                placeholder="1200"
              />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Math" value={math} onChange={setMath} placeholder="600" />
                <Field
                  label="Reading & Writing"
                  value={reading}
                  onChange={setReading}
                  placeholder="600"
                />
              </div>
              <Field
                label="Target score"
                value={target}
                onChange={setTarget}
                placeholder="1400"
              />
              <div>
                <label
                  htmlFor="test-date"
                  className="text-ink-faint text-[13px] font-medium"
                >
                  Test date, if you know it
                </label>
                <input
                  id="test-date"
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="border-line bg-surface mt-1.5 min-h-12 w-full rounded-xl border px-4 text-[15px]"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button onClick={saveStart}>Continue</Button>
              <button
                type="button"
                onClick={() => setStep("voice")}
                className="text-ink-faint min-h-11 w-full text-[13px] font-semibold"
              >
                Skip this
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <Eyebrow>How Beacon talks to you</Eyebrow>
              <h1 className="font-display text-[26px] leading-tight font-semibold">
                What kind of coaching helps?
              </h1>
              <p className="text-ink-muted text-sm leading-relaxed">
                This shapes the notes Beacon writes after a missed question. You
                can change it any time.
              </p>
            </div>

            <CoachingSheet
              preferences={preferences}
              onChange={setLocalPreferences}
            />

            <div className="space-y-2 pt-2">
              <Button onClick={finish}>Start training</Button>
              <button
                type="button"
                onClick={() => setStep("start")}
                className="text-ink-faint min-h-11 w-full text-[13px] font-semibold"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}) {
  const id = `field-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="text-ink-faint text-[13px] font-medium">
        {label}
      </label>
      <input
        id={id}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        placeholder={placeholder}
        className="border-line bg-surface mt-1.5 min-h-12 w-full rounded-xl border px-4 text-[15px]"
      />
    </div>
  );
}

/** SAT section scores run 200–800 and totals 400–1600; anything else is noise. */
function toScore(raw: string): number | null {
  if (!raw.trim()) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > 1600) return null;
  return value;
}
