/**
 * Beacon's mark: a minimal lighthouse throwing a single beam. Built to stay
 * legible at 16px, so the tower is a solid silhouette rather than an outline.
 */
export function Lighthouse({
  className,
  beam = true,
}: {
  className?: string;
  beam?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="Beacon"
      fill="none"
    >
      {beam && (
        <polygon points="15,8 25,2 25,7" fill="var(--amber)" opacity="0.55" />
      )}
      <polygon points="9,6 15,6 12,3" fill="currentColor" />
      <rect
        x="9"
        y="6"
        width="6"
        height="4"
        fill="var(--surface-2)"
        stroke="currentColor"
        strokeWidth="0.6"
      />
      <circle cx="12" cy="8" r="1" fill="var(--amber)" />
      <polygon points="8,21 16,21 14,10 10,10" fill="currentColor" />
    </svg>
  );
}
