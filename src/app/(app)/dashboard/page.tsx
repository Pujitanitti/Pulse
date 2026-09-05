import dynamic from "next/dynamic";
import { requireUser } from "@/lib/auth/require-user";
import { getDashboardData } from "@/server/services/dashboard";
import { TodaysPulse } from "@/components/dashboard/todays-pulse";
import { GoalsCard } from "@/components/dashboard/goals-card";
import { SkillsCard } from "@/components/dashboard/skills-card";
import { ContinueLearningCard } from "@/components/dashboard/continue-learning-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecommendedReadingCard } from "@/components/dashboard/recommended-reading-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { ChartCardSkeleton } from "@/components/ui/chart-skeleton";

const GrowthOverview = dynamic(() => import("@/components/dashboard/growth-overview").then((m) => m.GrowthOverview), {
  loading: () => <ChartCardSkeleton heightClass="h-80" />,
});

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id, 30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Good morning, {data.greetingName}.</h1>
        <p className="text-sm text-foreground/50">Here&apos;s what&apos;s happening in your world.</p>
      </div>

      <QuickActions />

      <TodaysPulse pulse={data.todaysPulse} />

      <GrowthOverview initialData={data.growth} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ContinueLearningCard items={data.continueLearning} />
        <GoalsCard goals={data.goals} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SkillsCard skills={data.skills} />
        <RecommendedReadingCard articles={data.recommendedReading} />
      </div>

      <RecentActivityCard activity={data.recentActivity} />
    </div>
  );
}
