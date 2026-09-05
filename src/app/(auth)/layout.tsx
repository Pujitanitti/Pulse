import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between p-8 sm:p-12">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Pulse
        </Link>
        <div className="mx-auto w-full max-w-sm">{children}</div>
        <p className="text-xs text-foreground/40">© {new Date().getFullYear()} Pulse</p>
      </div>
      <div className="relative hidden overflow-hidden bg-foreground lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_hsl(var(--accent-blue)/0.35),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_hsl(var(--accent-teal)/0.3),_transparent_55%)]" />

        <div className="relative flex h-full flex-col justify-between p-12">
          {/* Abstract product preview — a stylized suggestion of the app's
              shape (nav rail, stat tiles, a trend line), not a literal
              screenshot or invented numbers. Purely compositional. */}
          <div className="mt-8 rounded-xl border border-background/10 bg-background/5 p-5 backdrop-blur-sm">
            <div className="mb-4 flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-background/20" />
              <div className="h-2.5 w-2.5 rounded-full bg-background/20" />
              <div className="h-2.5 w-16 rounded-full bg-background/20" />
            </div>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-background/10 p-3">
                <div className="h-1.5 w-8 rounded-full bg-accent-blue/60" />
                <div className="mt-2 h-3 w-10 rounded bg-background/30" />
              </div>
              <div className="rounded-lg bg-background/10 p-3">
                <div className="h-1.5 w-8 rounded-full bg-accent-teal/60" />
                <div className="mt-2 h-3 w-10 rounded bg-background/30" />
              </div>
              <div className="rounded-lg bg-background/10 p-3">
                <div className="h-1.5 w-8 rounded-full bg-accent-coral/60" />
                <div className="mt-2 h-3 w-10 rounded bg-background/30" />
              </div>
            </div>
            <svg viewBox="0 0 300 60" className="h-14 w-full" preserveAspectRatio="none">
              <polyline
                points="0,45 30,35 60,42 90,20 120,30 150,10 180,25 210,15 240,28 270,12 300,20"
                fill="none"
                stroke="hsl(var(--accent-blue))"
                strokeOpacity="0.7"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="space-y-4">
            <p className="max-w-md text-2xl font-medium leading-snug text-background">
              &ldquo;Understand where you&apos;re going&rdquo; starts with knowing where you stand today.
            </p>
            <ul className="space-y-2 text-sm text-background/60">
              <li>— Skills, goals, and learning in one connected view</li>
              <li>— Real search across everything you&apos;ve saved</li>
              <li>— Progress that updates itself as you work</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
