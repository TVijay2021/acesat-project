"use client";

import { suggestTip } from "@/lib/agent/tip";
import {
  FORMAT_OPTIONS,
  LENGTH_OPTIONS,
  STYLE_OPTIONS,
} from "@/lib/profile";
import { useBeacon } from "@/lib/store";
import type { CoachingPreferences, Question } from "@/lib/types";
import { Eyebrow } from "./ui";

/** A stand-in question so the preview reads like a real note, not lorem. */
const SAMPLE: Question = {
  id: "sample",
  section: "math",
  number: 0,
  domain: "Algebra",
  skill: "Linear functions",
  stem: "",
  choices: [],
  format: "multiple-choice",
  answer: "",
  explanation:
    "The slope is the change in cost per additional game: 125 − 100 = 25.",
  distractorExplanation: null,
};

/**
 * Three choices, a live preview, and nothing else.
 *
 * A settings form the student has to imagine the effect of would not get
 * filled in honestly, so the sample note rewrites itself as they choose.
 */
export function CoachingSheet({
  preferences,
  onChange,
}: {
  preferences: CoachingPreferences;
  onChange: (next: CoachingPreferences) => void;
}) {
  return (
    <div className="space-y-4">
      <Row
        label="How much detail"
        options={LENGTH_OPTIONS}
        value={preferences.length}
        onSelect={(length) => onChange({ ...preferences, length })}
      />
      <Row
        label="Tone"
        options={STYLE_OPTIONS}
        value={preferences.style}
        onSelect={(style) => onChange({ ...preferences, style })}
      />
      <Row
        label="Shape"
        options={FORMAT_OPTIONS}
        value={preferences.format}
        onSelect={(format) => onChange({ ...preferences, format })}
      />

      <div
        className="rounded-xl p-3.5"
        style={{
          background: "var(--surface-2)",
          borderLeft: "3px solid var(--amber)",
        }}
      >
        <Eyebrow>Sounds like this</Eyebrow>
        <p className="mt-1.5 text-[13px] leading-relaxed whitespace-pre-line">
          {suggestTip(SAMPLE, "rushed", preferences)}
        </p>
      </div>
    </div>
  );
}

function Row<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onSelect: (next: T) => void;
}) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              aria-pressed={active}
              className="border-line min-h-9 rounded-full border px-3.5 text-[13px] font-semibold"
              style={{
                background: active ? "var(--amber)" : "var(--surface)",
                color: active ? "var(--bg-deep)" : "var(--text-muted)",
                borderColor: active ? "var(--amber)" : "var(--border)",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
