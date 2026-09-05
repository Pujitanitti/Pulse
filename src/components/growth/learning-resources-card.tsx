"use client";

import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AddResourceDialog } from "@/components/growth/add-resource-dialog";
import { LogSessionDialog } from "@/components/growth/log-session-dialog";
import type { LearningResourceDetail } from "@/server/services/growth";

const STATUS_VARIANT = { WANT_TO_LEARN: "default", LEARNING: "blue", COMPLETED: "green" } as const;

function statusLabel(status: string) {
  return status
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

export function LearningResourcesCard({ resources }: { resources: LearningResourceDetail[] }) {
  const router = useRouter();

  async function markCompleted(id: string) {
    await fetch(`/api/learning/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED", progress: 100 }),
    });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Learning</CardTitle>
        <AddResourceDialog />
      </CardHeader>
      <CardContent>
        {resources.length === 0 ? (
          <EmptyState icon={GraduationCap} title="Nothing on your list yet" description="Add a course, book, or article to start tracking it." />
        ) : (
          <ul className="space-y-4">
            {resources.map((r) => (
              <li key={r.id} className="space-y-2 border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium leading-snug">{r.title}</p>
                    <p className="text-xs text-foreground/40">
                      {r.sessionCount > 0 ? `${Math.round(r.totalMinutes / 60)}h ${r.totalMinutes % 60}m logged` : "No sessions logged yet"}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[r.status as keyof typeof STATUS_VARIANT] ?? "default"}>{statusLabel(r.status)}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <LogSessionDialog resourceId={r.id} />
                  {r.status !== "COMPLETED" && (
                    <button onClick={() => markCompleted(r.id)} className="text-xs text-accent-blue hover:underline">
                      Mark completed
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
