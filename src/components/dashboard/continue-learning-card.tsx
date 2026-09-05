import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardData } from "@/server/services/dashboard";

function categoryLabel(type: string): string {
  return type
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

export function ContinueLearningCard({ items }: { items: DashboardData["continueLearning"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Continue learning</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Nothing in progress"
            description="Start a course, book, or article and it'll show up here to pick back up."
          />
        ) : (
          <>
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{item.title}</p>
                    <span className="shrink-0 text-xs text-foreground/40">{categoryLabel(item.type)}</span>
                  </div>
                  <Progress value={item.progress} />
                  <p className="text-xs text-foreground/50">{item.progress}% complete</p>
                </li>
              ))}
            </ul>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href="/learning">Continue in Learning</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
