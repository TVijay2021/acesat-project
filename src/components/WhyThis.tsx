"use client";

import { useState } from "react";
import { useBeacon } from "@/lib/store";
import { Eyebrow } from "./ui";

/**
 * The evidence behind a recommendation, folded away until asked for.
 *
 * Shows what Beacon observed and what it expects to happen — the same claim
 * the Decision Ledger will later grade itself against. It deliberately does
 * not narrate how the choice was reached; a student needs the reasons they can
 * check, not a transcript of the deliberation.
 */
export function WhyThis({ decisionId }: { decisionId?: string }) {
  const { route, decisions, setTab } = useBeacon();
  const [open, setOpen] = useState(false);

  const decision =
    decisions.find((d) => d.id === (decisionId ?? route?.decisionId)) ?? null;
  const rationale = route?.rationale ?? decision?.evidence ?? null;

  if (!rationale && !decision) return null;

  return (
    <div className="border-line border-t pt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="text-ink-muted flex w-full items-center justify-between gap-3
                   text-left text-[13px] font-semibold"
      >
        Why Beacon chose this
        <span
          aria-hidden
          className="shrink-0 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        >
          ⌄
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {rationale && (
            <div>
              <Eyebrow>What Beacon saw</Eyebrow>
              <p className="text-ink-muted mt-1 text-[13px] leading-relaxed">
                {rationale}
              </p>
            </div>
          )}

          {decision && (
            <>
              <div>
                <Eyebrow>What it expects</Eyebrow>
                <p className="mt-1 text-[13px] leading-relaxed">
                  {decision.prediction}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTab("beacon")}
                className="text-[13px] font-semibold underline underline-offset-4"
                style={{ color: "var(--amber)" }}
              >
                {decision.outcome === "pending"
                  ? "Beacon will check this next sync →"
                  : "See how this turned out →"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
