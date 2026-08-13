"use client";

import { useEffect } from "react";

/** Registers the hand-written worker. Failure here must never break the app. */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline-after-first-visit is a progressive enhancement, not a
      // requirement — the student's data is already in IndexedDB.
    });
  }, []);
  return null;
}
