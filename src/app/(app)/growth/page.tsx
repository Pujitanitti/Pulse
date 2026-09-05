import dynamic from "next/dynamic";
import { requireUser } from "@/lib/auth/require-user";
import { getGrowthData } from "@/server/services/growth";
import { LearningResourcesCard } from "@/components/growth/learning-resources-card";
import { ActivityHeatmapCard } from "@/components/growth/activity-heatmap-card";
import { LogSessionDialog } from "@/components/growth/log-session-dialog";
import { ChartCardSkeleton } from "@/components/ui/chart-skeleton";

// Recharts (~90kb+ with its d3 dependencies) is code-split out of the main
// route bundle for every page that doesn't render a chart — dynamic()
// gives each of these its own chunk, fetched only when this page renders,
// rather than shipping recharts to visitors of /goals, /library, etc. who
// never see it. SSR stays on (no `ssr: false`) since these components
// don't need client-only browser APIs to render their initial markup.
const SkillsRadarCard = dynamic(() => import("@/components/growth/skills-radar-card").then((m) => m.SkillsRadarCard), {
  loading: () => <ChartCardSkeleton />,
});
const MonthlyGrowthCard = dynamic(() => import("@/components/growth/monthly-growth-card").then((m) => m.MonthlyGrowthCard), {
  loading: () => <ChartCardSkeleton />,
});
const SkillsListCard = dynamic(() => import("@/components/growth/skills-list-card").then((m) => m.SkillsListCard), {
  loading: () => <ChartCardSkeleton />,
});

export default async function GrowthPage() {
  const user = await requireUser();
  const data = await getGrowthData(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Growth</h1>
          <p className="text-sm text-foreground/50">Skills, learning, and momentum over time.</p>
        </div>
        <LogSessionDialog />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SkillsRadarCard skills={data.skills} />
        <MonthlyGrowthCard data={data.monthlyGrowth} />
      </div>

      <ActivityHeatmapCard heatmap={data.heatmap} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SkillsListCard skills={data.skills} />
        <LearningResourcesCard resources={data.learningResources} />
      </div>
    </div>
  );
}
