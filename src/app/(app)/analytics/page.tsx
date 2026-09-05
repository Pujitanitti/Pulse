import dynamic from "next/dynamic";
import { requireUser } from "@/lib/auth/require-user";
import { getAnalyticsData } from "@/server/services/analytics";
import { ChartCardSkeleton } from "@/components/ui/chart-skeleton";

const AnalyticsDashboard = dynamic(() => import("@/components/analytics/analytics-dashboard").then((m) => m.AnalyticsDashboard), {
  loading: () => (
    <div className="space-y-6">
      <ChartCardSkeleton heightClass="h-64" />
      <ChartCardSkeleton heightClass="h-64" />
      <ChartCardSkeleton heightClass="h-40" />
    </div>
  ),
});

export default async function AnalyticsPage() {
  const user = await requireUser();
  const initial = await getAnalyticsData(user.id, 30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-foreground/50">Growth, knowledge, and productivity in one place.</p>
      </div>
      <AnalyticsDashboard initial={initial} />
    </div>
  );
}
