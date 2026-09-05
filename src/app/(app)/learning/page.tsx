import dynamic from "next/dynamic";
import { requireUser } from "@/lib/auth/require-user";
import { listLearningResourcesFiltered, getLearningAnalytics } from "@/server/services/growth";
import { listLearningResourcesQuerySchema } from "@/server/validation/growth";
import { LearningBoard } from "@/components/learning/learning-board";
import { ChartCardSkeleton } from "@/components/ui/chart-skeleton";

const LearningAnalyticsCard = dynamic(
  () => import("@/components/learning/learning-analytics-card").then((m) => m.LearningAnalyticsCard),
  { loading: () => <ChartCardSkeleton heightClass="h-72" /> }
);

export default async function LearningPage() {
  const user = await requireUser();
  const [resources, analytics] = await Promise.all([
    listLearningResourcesFiltered(user.id, listLearningResourcesQuerySchema.parse({})),
    getLearningAnalytics(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Learning</h1>
        <p className="text-sm text-foreground/50">Courses, books, articles, and everything you&apos;re working through.</p>
      </div>

      <LearningAnalyticsCard analytics={analytics} />
      <LearningBoard initial={resources} />
    </div>
  );
}
