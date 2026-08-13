import { Lighthouse } from "@/components/Lighthouse";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-7 text-center">
      <Lighthouse className="h-14 w-14" />
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold">Welcome to Beacon</h1>
        <p className="text-ink-muted text-[15px] leading-relaxed">
          Let&rsquo;s figure out where you&rsquo;re headed.
        </p>
      </div>
      <p className="text-ink-faint text-xs">
        Data layer and decision engine are wired. Screens land next.
      </p>
    </main>
  );
}
