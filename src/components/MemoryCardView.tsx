"use client";

import { useMemo } from "react";
import { buildCard } from "@/lib/agent/memorycard";
import { useBeacon } from "@/lib/store";
import { Lighthouse } from "./Lighthouse";

/**
 * The one thing worth keeping in sight.
 *
 * Built to be screenshotted: a fixed 3:4 block with its own dark palette in
 * both themes, so it reads as a card the student took out of the app rather
 * than a panel that happens to be in it.
 */
export function MemoryCardView() {
  const { decisions, attempts, questions } = useBeacon();
  const card = useMemo(
    () => buildCard(decisions, attempts, questions),
    [decisions, attempts, questions]
  );

  // Nothing has been earned yet, and a generic poster would cheapen the ones
  // that are earned. Render nothing.
  if (!card) return null;

  return (
    <figure className="space-y-2">
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-8"
        style={{
          // Its own palette, not the app's — the card should look the same
          // whichever theme it was captured in.
          background:
            "linear-gradient(165deg, oklch(0.22 0.035 250), oklch(0.13 0.03 250))",
          color: "oklch(0.95 0.012 75)",
        }}
      >
        {/* The beam, running behind the text. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 -right-10 h-48 w-48 rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.78 0.13 75 / 0.22), transparent 68%)",
          }}
        />

        <div className="relative space-y-5">
          <div className="flex items-center gap-2">
            <Lighthouse className="h-4 w-4" />
            <span
              className="text-[10px] font-semibold tracking-[0.18em] uppercase"
              style={{ color: "oklch(0.78 0.13 75)" }}
            >
              Keep this in sight
            </span>
          </div>

          <div className="space-y-3">
            <p className="font-display text-[26px] leading-[1.15] font-semibold text-balance">
              {card.headline}
            </p>
            <p
              className="text-[15px] leading-relaxed"
              style={{ color: "oklch(0.82 0.02 250)" }}
            >
              {card.body}
            </p>
          </div>

          <p
            className="border-t pt-4 text-[11px] leading-relaxed"
            style={{
              borderColor: "oklch(0.6 0.03 250 / 0.22)",
              color: "oklch(0.62 0.02 250)",
            }}
          >
            {card.because}
          </p>
        </div>
      </div>

      <figcaption className="text-ink-faint text-center text-[11px]">
        Beacon writes this from your own results. It changes as you do.
      </figcaption>
    </figure>
  );
}
