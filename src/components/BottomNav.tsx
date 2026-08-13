"use client";

import { Lighthouse } from "./Lighthouse";
import { useBeacon, type Tab } from "@/lib/store";

const TABS: { id: Tab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "train", label: "Train" },
  { id: "review", label: "Review" },
  { id: "progress", label: "Progress" },
  { id: "beacon", label: "Beacon" },
];

/**
 * Drawn rather than typed. Unicode glyphs like ◈ and ◍ fall back to whatever
 * the system has and render inconsistently across devices — exactly the older
 * hardware this app targets.
 */
function TabIcon({ id }: { id: Tab }) {
  return (
    <svg viewBox="0 0 18 18" className="h-[18px] w-[18px]" aria-hidden fill="none">
      {id === "home" && (
        // Compass rose.
        <>
          <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" />
          <path d="M9 4.5 L10.6 9 L9 13.5 L7.4 9 Z" fill="currentColor" />
        </>
      )}
      {id === "train" && (
        // Sail.
        <>
          <path
            d="M9 2.5 L14 12 H9 Z"
            fill="currentColor"
          />
          <path
            d="M3.5 15 h11"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </>
      )}
      {id === "review" && (
        // Folded page with a turned corner — the cram sheet.
        <>
          <path
            d="M4 2.5h6.5L14 6v9.5H4z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M10.5 2.5V6H14" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M6.5 10h5M6.5 12.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
      {id === "progress" && (
        // Rising depth marks.
        <>
          <rect x="2.5" y="11" width="3" height="5" rx="1" fill="currentColor" />
          <rect x="7.5" y="7.5" width="3" height="8.5" rx="1" fill="currentColor" />
          <rect x="12.5" y="4" width="3" height="12" rx="1" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

export function BottomNav() {
  const { tab, setTab } = useBeacon();

  return (
    <nav
      aria-label="Main"
      className="border-line bg-bg-deep/95 sticky bottom-0 z-20 border-t backdrop-blur
                 pb-[env(safe-area-inset-bottom)] sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b"
    >
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map(({ id, label }) => {
          const active = tab === id;
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => setTab(id)}
                aria-current={active ? "page" : undefined}
                className="flex min-h-14 w-full flex-col items-center justify-center gap-1
                           text-[11px] font-semibold tracking-wide transition-colors"
                style={{ color: active ? "var(--amber)" : "var(--text-faint)" }}
              >
                {id === "beacon" ? (
                  <Lighthouse className="h-[18px] w-[18px]" beam={active} />
                ) : (
                  <TabIcon id={id} />
                )}
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
