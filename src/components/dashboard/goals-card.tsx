import { Target } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import type { GoalSummary } from "@/server/services/dashboard";

const PRIORITY_VARIANT = { HIGH: "coral", MEDIUM: "blue", LOW: "default" } as const;

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "No deadline";
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `${days} days left`;
}

export function GoalsCard({ goals }: { goals: GoalSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current goals</CardTitle>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Set your first goal and Pulse will track progress toward it."
          />
        ) : (
          <ul className="space-y-4">
            {goals.map((goal) => (
              <li key={goal.id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">{goal.title}</p>
                  <Badge variant={PRIORITY_VARIANT[goal.priority as keyof typeof PRIORITY_VARIANT] ?? "default"}>
                    {goal.priority.toLowerCase()}
                  </Badge>
                </div>
                <Progress value={goal.progress} />
                <div className="flex items-center justify-between text-xs text-foreground/50">
                  <span>
                    {goal.milestonesCompleted}/{goal.milestonesTotal} milestones
                  </span>
                  <span>{formatDeadline(goal.deadline)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
