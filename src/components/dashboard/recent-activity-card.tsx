import { History, Target, BookMarked, GraduationCap, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ActivityItem } from "@/server/services/dashboard";

const ICONS: Record<string, typeof Target> = {
  GOAL_CREATED: Target,
  GOAL_COMPLETED: CheckCircle2,
  MILESTONE_COMPLETED: CheckCircle2,
  ARTICLE_SAVED: BookMarked,
  RESOURCE_COMPLETED: GraduationCap,
  SKILL_UPDATED: Sparkles,
  LEARNING_SESSION_LOGGED: GraduationCap,
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function RecentActivityCard({ activity }: { activity: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <EmptyState icon={History} title="Nothing yet" description="Your activity timeline will show up here as you use Pulse." />
        ) : (
          <ol className="space-y-4">
            {activity.map((item) => {
              const Icon = ICONS[item.type] ?? History;
              return (
                <li key={item.id} className="flex gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background">
                    <Icon className="h-3.5 w-3.5 text-foreground/50" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm leading-snug">{item.title}</p>
                    <p className="text-xs text-foreground/40">{timeAgo(item.occurredAt)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
