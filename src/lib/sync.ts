import type { SyncRequest, SyncResponse } from "@/app/api/sync/route";
import { db } from "./db";
import type { Attempt, Decision } from "./types";

export const SYNC_STAGES = [
  "Syncing your training",
  "Reviewing your results",
  "Checking previous predictions",
  "Updating your route",
] as const;

export interface SyncSummary {
  graded: { focus: string; outcome: "confirmed" | "missed"; note: string }[];
  newFocus: string | null;
  sessionsPacked: number;
  authored: boolean;
}

/**
 * The one network call in the app. Applies the server's answer to local state
 * in a single transaction so a mid-write failure cannot leave the student with
 * a route that points at a decision that was never saved.
 */
export async function runSync(
  attempts: Attempt[],
  decisions: Decision[]
): Promise<SyncSummary> {
  const payload: SyncRequest = { attempts, decisions };

  const response = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`Sync failed with ${response.status}`);
  const result = (await response.json()) as SyncResponse;

  const gradedAt = Date.now();

  await db.transaction(
    "rw",
    db.decisions,
    db.routes,
    db.sessions,
    db.attempts,
    async () => {
      for (const grade of result.graded) {
        await db.decisions.update(grade.id, {
          outcome: grade.outcome,
          outcomeNote: grade.outcomeNote,
          gradedAt,
        });
      }
      if (result.decision) await db.decisions.put(result.decision);
      if (result.route) await db.routes.put(result.route);
      if (result.sessions.length) await db.sessions.bulkPut(result.sessions);

      // Attempts are now folded into a decision outcome.
      const unsynced = await db.attempts.filter((a) => !a.synced).toArray();
      for (const attempt of unsynced) {
        if (attempt.id !== undefined) {
          await db.attempts.update(attempt.id, { synced: true });
        }
      }
    }
  );

  const focusOf = (id: string) =>
    decisions.find((d) => d.id === id)?.focus ?? "Previous decision";

  return {
    graded: result.graded.map((g) => ({
      focus: focusOf(g.id),
      outcome: g.outcome,
      note: g.outcomeNote,
    })),
    newFocus: result.decision?.focus ?? null,
    sessionsPacked: result.sessions.length,
    authored: result.authored,
  };
}
