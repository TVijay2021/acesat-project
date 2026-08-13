"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { currentRoute, db, ledger, sessionsForRoute } from "./db";
import { seedIfEmpty } from "./seed";
import { runSync, SYNC_STAGES, type SyncSummary } from "./sync";
import type {
  Attempt,
  Confidence,
  Decision,
  MistakeReason,
  Question,
  Route,
  TrainingSession,
} from "./types";

export type Tab = "home" | "train" | "progress" | "beacon";

interface BeaconState {
  ready: boolean;
  online: boolean;
  questions: Map<string, Question>;
  attempts: Attempt[];
  decisions: Decision[];
  route: Route | null;
  sessions: TrainingSession[];
  tab: Tab;
  setTab: (tab: Tab) => void;
  /** Demo control: lets a judge toggle connectivity without airplane mode. */
  simulateOffline: boolean;
  setSimulateOffline: (value: boolean) => void;
  recordAttempt: (attempt: Omit<Attempt, "id">) => Promise<void>;
  completeSession: (sessionId: string) => Promise<void>;
  refresh: () => Promise<void>;
  sync: SyncState;
  startSync: () => Promise<void>;
  dismissSync: () => void;
}

export type SyncState =
  | { status: "idle" }
  | { status: "running"; stage: number }
  | { status: "done"; summary: SyncSummary }
  | { status: "failed" };

const BeaconContext = createContext<BeaconState | null>(null);

export function BeaconProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [navigatorOnline, setNavigatorOnline] = useState(true);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [questions, setQuestions] = useState<Map<string, Question>>(new Map());
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [route, setRoute] = useState<Route | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [tab, setTab] = useState<Tab>("home");

  const refresh = useCallback(async () => {
    const [allQuestions, allAttempts, allDecisions, activeRoute] =
      await Promise.all([
        db.questions.toArray(),
        db.attempts.toArray(),
        ledger(),
        currentRoute(),
      ]);
    setQuestions(new Map(allQuestions.map((q) => [q.id, q])));
    setAttempts(allAttempts);
    setDecisions(allDecisions);
    setRoute(activeRoute);
    setSessions(activeRoute ? await sessionsForRoute(activeRoute.id) : []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await seedIfEmpty();
      if (cancelled) return;
      await refresh();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    const update = () => setNavigatorOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const recordAttempt = useCallback(
    async (attempt: Omit<Attempt, "id">) => {
      await db.attempts.add(attempt as Attempt);
      await refresh();
    },
    [refresh]
  );

  const completeSession = useCallback(
    async (sessionId: string) => {
      await db.sessions.update(sessionId, { completedAt: Date.now() });
      await refresh();
    },
    [refresh]
  );

  const [sync, setSync] = useState<SyncState>({ status: "idle" });

  const startSync = useCallback(async () => {
    setSync({ status: "running", stage: 0 });

    // The stages are paced so the student can read them. The request runs in
    // parallel, so a fast network still shows the full check-in sequence and a
    // slow one simply holds on the last stage.
    const paced = (async () => {
      for (let stage = 1; stage < SYNC_STAGES.length; stage++) {
        await new Promise((resolve) => setTimeout(resolve, 700));
        setSync({ status: "running", stage });
      }
    })();

    try {
      const [summary] = await Promise.all([runSync(attempts, decisions), paced]);
      await refresh();
      setSync({ status: "done", summary });
    } catch {
      setSync({ status: "failed" });
    }
  }, [attempts, decisions, refresh]);

  const dismissSync = useCallback(() => setSync({ status: "idle" }), []);

  const value = useMemo<BeaconState>(
    () => ({
      ready,
      online: navigatorOnline && !simulateOffline,
      questions,
      attempts,
      decisions,
      route,
      sessions,
      tab,
      setTab,
      simulateOffline,
      setSimulateOffline,
      recordAttempt,
      completeSession,
      refresh,
      sync,
      startSync,
      dismissSync,
    }),
    [
      ready,
      navigatorOnline,
      simulateOffline,
      questions,
      attempts,
      decisions,
      route,
      sessions,
      tab,
      recordAttempt,
      completeSession,
      refresh,
      sync,
      startSync,
      dismissSync,
    ]
  );

  return <BeaconContext.Provider value={value}>{children}</BeaconContext.Provider>;
}

export function useBeacon(): BeaconState {
  const context = useContext(BeaconContext);
  if (!context) throw new Error("useBeacon must be used inside BeaconProvider");
  return context;
}

export function nextSessionOf(sessions: TrainingSession[]) {
  return sessions.find((s) => s.completedAt === null) ?? null;
}

export type { Confidence, MistakeReason };
