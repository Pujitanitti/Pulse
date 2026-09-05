"use client";

import { useState } from "react";
import { ChevronDown, Archive, ArchiveRestore, Trash2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MilestoneList } from "@/components/goals/milestone-list";
import { cn } from "@/lib/utils";
import type { GoalView } from "@/server/services/goals";

const PRIORITY_VARIANT = { HIGH: "coral", MEDIUM: "blue", LOW: "default" } as const;
const STATUS_VARIANT = { NOT_STARTED: "default", IN_PROGRESS: "blue", COMPLETED: "green", PAUSED: "default" } as const;

function statusLabel(status: string) {
  return status
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

function formatDeadline(deadline: string | null): { text: string; overdue: boolean } {
  if (!deadline) return { text: "No deadline", overdue: false };
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: `${Math.abs(days)} days overdue`, overdue: true };
  if (days === 0) return { text: "Due today", overdue: false };
  if (days === 1) return { text: "Due tomorrow", overdue: false };
  return { text: `${days} days left`, overdue: false };
}

export function GoalCard({ goal, onChanged }: { goal: GoalView; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const deadline = formatDeadline(goal.deadline);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    onChanged();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${goal.title}"? This can't be undone.`)) return;
    setBusy(true);
    await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
    setBusy(false);
    onChanged();
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={PRIORITY_VARIANT[goal.priority as keyof typeof PRIORITY_VARIANT] ?? "default"}>
                {goal.priority.toLowerCase()}
              </Badge>
              <Badge variant={STATUS_VARIANT[goal.status as keyof typeof STATUS_VARIANT] ?? "default"}>
                {statusLabel(goal.status)}
              </Badge>
            </div>
            <h3 className="font-medium leading-snug">{goal.title}</h3>
            {goal.description && <p className="text-sm text-foreground/50">{goal.description}</p>}
          </div>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="shrink-0 rounded-full p-1 hover:bg-surface"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <ChevronDown className={cn("h-4 w-4 text-foreground/40 transition-transform", expanded && "rotate-180")} />
          </button>
        </div>

        <Progress value={goal.progress} />
        <div className="flex items-center justify-between text-xs text-foreground/50">
          <span>
            {goal.milestones.filter((m) => m.completed).length}/{goal.milestones.length || 0} milestones
          </span>
          <span className={cn(deadline.overdue && "font-medium text-accent-coral")}>{deadline.text}</span>
        </div>

        {expanded && (
          <div className="space-y-4 border-t border-border pt-3">
            <MilestoneList goal={goal} onChanged={onChanged} />

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {goal.status !== "COMPLETED" && (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => patch({ status: "COMPLETED" })}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Mark complete
                </Button>
              )}
              {goal.status === "IN_PROGRESS" ? (
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => patch({ status: "PAUSED" })}>
                  Pause
                </Button>
              ) : goal.status === "PAUSED" ? (
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => patch({ status: "IN_PROGRESS" })}>
                  Resume
                </Button>
              ) : goal.status === "NOT_STARTED" ? (
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => patch({ status: "IN_PROGRESS" })}>
                  Start
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => patch({ archived: !goal.archived })}
              >
                {goal.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                {goal.archived ? "Unarchive" : "Archive"}
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={handleDelete} className="text-accent-coral hover:text-accent-coral">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
