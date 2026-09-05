import Link from "next/link";
import { Newspaper, Target, GraduationCap, TrendingUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Newspaper,
    title: "Discovery",
    description: "Editorial tech, AI, and engineering coverage with real search, not a keyword-stuffed feed.",
  },
  {
    icon: TrendingUp,
    title: "Growth",
    description: "Track skills over time with a radar view, activity heatmap, and monthly momentum — not a single static number.",
  },
  {
    icon: Target,
    title: "Goals",
    description: "Milestones drive progress automatically. Archive what's done, keep moving on what isn't.",
  },
  {
    icon: GraduationCap,
    title: "Learning",
    description: "Courses, books, and articles with logged sessions, ratings, and a completion rate that means something.",
  },
  {
    icon: Search,
    title: "One search",
    description: "Articles, skills, resources, and goals — search across all of it from one bar instead of hunting per page.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
        <p className="text-sm font-medium uppercase tracking-widest text-accent-blue">Pulse</p>
        <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Understand where you&apos;re going.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-foreground/60">
          Discovery, goals, learning, and growth — one workspace instead of a
          bookmarks folder, a spreadsheet, and three separate apps.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/signup">Create your workspace</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-blue/10">
                  <Icon className="h-4 w-4 text-accent-blue" />
                </div>
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm text-foreground/60">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Ready to see where you stand?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-foreground/60">
            Create a free workspace and start tracking in a couple of minutes.
          </p>
          <div className="mt-6">
            <Button asChild size="lg">
              <Link href="/signup">Create your workspace</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
