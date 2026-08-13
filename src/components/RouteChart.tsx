import type { TrainingSession } from "@/lib/types";

/**
 * The hero visual: a lighthouse throwing a beam along the student's route,
 * with one milestone per training block. Completed stops are filled, the next
 * one is ringed. Pure SVG, no animation dependency.
 */
export function RouteChart({
  sessions,
  focus,
}: {
  sessions: TrainingSession[];
  focus: string;
}) {
  const stops = sessions.length || 1;
  const nextIndex = sessions.findIndex((s) => s.completedAt === null);

  return (
    <svg
      viewBox="0 0 320 92"
      className="w-full"
      role="img"
      aria-label={`Route toward ${focus}, ${sessions.filter((s) => s.completedAt).length} of ${sessions.length} sessions complete`}
    >
      <defs>
        <linearGradient id="beam" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.42" />
          <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Beam sweeping from the tower toward the destination. */}
      <polygon points="30,44 300,20 300,64" fill="url(#beam)" />

      {/* Coastline. */}
      <path
        d="M0 78 Q 40 72 78 78 T 160 78 T 240 78 T 320 78"
        stroke="var(--border-strong)"
        strokeWidth="1"
        fill="none"
      />

      {/* Lighthouse. */}
      <g>
        <polygon points="18,44 30,44 24,36" fill="var(--text)" />
        <rect
          x="18"
          y="44"
          width="12"
          height="8"
          fill="var(--surface-2)"
          stroke="var(--text)"
          strokeWidth="0.8"
        />
        <circle cx="24" cy="48" r="2" fill="var(--amber)" />
        <polygon points="16,78 32,78 29,52 19,52" fill="var(--text)" />
      </g>

      {/* Route line and milestones. */}
      <line
        x1="52"
        y1="44"
        x2="296"
        y2="44"
        stroke="var(--border-strong)"
        strokeWidth="1"
        strokeDasharray="3 4"
      />
      {sessions.map((session, i) => {
        const x = 52 + (i * 244) / Math.max(stops - 1, 1);
        const done = session.completedAt !== null;
        const isNext = i === nextIndex;
        return (
          <g key={session.id}>
            <circle
              cx={x}
              cy={44}
              r={isNext ? 6 : 4}
              fill={done ? "var(--amber)" : "var(--bg)"}
              stroke={done || isNext ? "var(--amber)" : "var(--border-strong)"}
              strokeWidth={isNext ? 2 : 1}
            />
            <text
              x={x}
              y={62}
              textAnchor="middle"
              fontSize="7"
              fill="var(--text-faint)"
            >
              {session.kind}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
