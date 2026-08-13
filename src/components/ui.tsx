/** Shared primitives. Kept deliberately small — no component library. */

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`border-line bg-surface rounded-2xl border p-5 ${className}`}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-ink-faint text-[10px] font-semibold tracking-[0.12em] uppercase">
      {children}
    </p>
  );
}

export function Meter({
  label,
  value,
  caption,
}: {
  label: string;
  value: number;
  caption: string;
}) {
  const filled = Math.round(value * 10);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        {/* The number carries the value; the bar is reinforcement, not the
            only signal, so this reads without colour or shape perception. */}
        <span className="tabular text-ink-muted text-sm">{caption}</span>
      </div>
      <div
        className="bg-surface-2 h-2 overflow-hidden rounded-full"
        role="img"
        aria-label={`${label}, ${caption}`}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${filled * 10}%`, background: "var(--amber)" }}
        />
      </div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "quiet";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const primary = variant === "primary";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="min-h-12 w-full rounded-xl px-5 text-[15px] font-semibold
                 transition-opacity disabled:opacity-45"
      style={
        primary
          ? { background: "var(--amber)", color: "var(--bg-deep)" }
          : {
              background: "var(--surface-2)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }
      }
    >
      {children}
    </button>
  );
}
