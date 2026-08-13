import type {
  CoachingPreferences,
  CoachingStyle,
  FeedbackFormat,
  FeedbackLength,
  LearnerProfile,
} from "./types";

const KEY = "beacon.profile";

export const DEFAULT_PREFERENCES: CoachingPreferences = {
  length: "balanced",
  style: "constructive",
  format: "notes",
};

export const DEFAULT_PROFILE: LearnerProfile = {
  preferences: DEFAULT_PREFERENCES,
  startingPoint: null,
  onboarded: false,
};

/** Option lists, kept next to the types so the UI can't drift from them. */
export const LENGTH_OPTIONS: { id: FeedbackLength; label: string }[] = [
  { id: "concise", label: "Concise" },
  { id: "balanced", label: "Balanced" },
  { id: "detailed", label: "Detailed" },
];

export const STYLE_OPTIONS: { id: CoachingStyle; label: string }[] = [
  { id: "encouraging", label: "Encouraging" },
  { id: "direct", label: "Direct" },
  { id: "constructive", label: "Constructive" },
  { id: "socratic", label: "Socratic" },
];

export const FORMAT_OPTIONS: { id: FeedbackFormat; label: string }[] = [
  { id: "notes", label: "Short notes" },
  { id: "bullets", label: "Bullets" },
  { id: "steps", label: "Step-by-step" },
  { id: "questions", label: "Questions" },
];

/**
 * Preferences live in localStorage rather than IndexedDB: they are settings,
 * not learning data, and they must be readable before the database opens so
 * the first screen is already in the student's chosen voice.
 */
export function loadProfile(): LearnerProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<LearnerProfile>;
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      // Merge rather than replace, so a preference added later has a default.
      preferences: { ...DEFAULT_PREFERENCES, ...(parsed.preferences ?? {}) },
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: LearnerProfile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // Blocked storage: the session still works, it just won't be remembered.
  }
}

/** Whole days until the test, or null when no date was given. */
export function daysUntilTest(testDate: string | null): number | null {
  if (!testDate) return null;
  const target = new Date(`${testDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  return Math.round((target.getTime() - startOfToday) / 86_400_000);
}
