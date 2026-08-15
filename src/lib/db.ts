import Dexie, { type EntityTable } from "dexie";
import type {
  Attempt,
  Decision,
  MemoryCard,
  Question,
  ExamRecord,
  Route,
  TrainingSession,
} from "./types";

/**
 * Everything the student needs offline lives here. The app reads only from
 * Dexie — the network is used exclusively by the sync route, so training works
 * identically with the radio off.
 */
class BeaconDB extends Dexie {
  questions!: EntityTable<Question, "id">;
  attempts!: EntityTable<Attempt, "id">;
  sessions!: EntityTable<TrainingSession, "id">;
  routes!: EntityTable<Route, "id">;
  decisions!: EntityTable<Decision, "id">;
  cards!: EntityTable<MemoryCard, "id">;
  exams!: EntityTable<ExamRecord, "id">;

  constructor() {
    super("beacon");
    this.version(1).stores({
      questions: "id, section, domain, skill",
      attempts: "++id, questionId, sessionId, answeredAt, synced",
      sessions: "id, routeId, day, completedAt",
      routes: "id, createdAt",
      decisions: "id, createdAt, outcome",
      cards: "id, createdAt",
    });
    // Practice tests arrived after the first schema, so they get their own
    // version rather than mutating v1 — an existing database must keep its
    // data when a returning student loads the new build.
    this.version(2).stores({
      exams: "id, takenAt",
    });
  }
}

export const db = new BeaconDB();

/** The route Beacon most recently packed, or null before the first sync. */
export async function currentRoute(): Promise<Route | null> {
  const routes = await db.routes.orderBy("createdAt").reverse().limit(1).toArray();
  return routes[0] ?? null;
}

/** Training blocks for a route, in the order the student should work them. */
export async function sessionsForRoute(routeId: string): Promise<TrainingSession[]> {
  const sessions = await db.sessions.where("routeId").equals(routeId).toArray();
  return sessions.sort((a, b) => a.day - b.day);
}

/** The next unfinished block, or null when the route is complete. */
export async function nextSession(): Promise<TrainingSession | null> {
  const route = await currentRoute();
  if (!route) return null;
  const sessions = await sessionsForRoute(route.id);
  return sessions.find((s) => s.completedAt === null) ?? null;
}

/** Ledger entries, newest first — the order the Decision Ledger renders. */
export async function ledger(): Promise<Decision[]> {
  return db.decisions.orderBy("createdAt").reverse().toArray();
}

/** Attempts Beacon has not yet folded into a decision outcome. */
export async function unsyncedAttempts(): Promise<Attempt[]> {
  return db.attempts.filter((a) => !a.synced).toArray();
}

/** Practice tests taken, newest first. */
export async function examHistory(): Promise<ExamRecord[]> {
  return db.exams.orderBy("takenAt").reverse().toArray();
}
