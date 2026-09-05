"use client";

import { useEffect, useRef, useState } from "react";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GoalCard } from "@/components/goals/goal-card";
import { AddGoalDialog } from "@/components/goals/add-goal-dialog";
import type { GoalView } from "@/server/services/goals";

const STATUSES = [
  { label: "All", value: null },
  { label: "Not started", value: "NOT_STARTED" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Paused", value: "PAUSED" },
];

const SORTS = [
  { label: "Deadline", value: "deadline" },
  { label: "Priority", value: "priority" },
  { label: "Newest", value: "newest" },
];

export function GoalsBoard({ initial }: { initial: GoalView[] }) {
  const [status, setStatus] = useState<string | null>(null);
  const [sort, setSort] = useState("deadline");
  const [showArchived, setShowArchived] = useState(false);
  const [goals, setGoals] = useState(initial);
  const [loading, setLoading] = useState(false);
  const isFirstRun = useRef(true);

  async function fetchGoals() {
    setLoading(true);
    const params = new URLSearchParams({ sort, archived: String(showArchived) });
    if (status) params.set("status", status);
    const res = await fetch(`/api/goals?${params.toString()}`);
    const json = await res.json();
    setGoals(json.data as GoalView[]);
    setLoading(false);
  }

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, sort, showArchived]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Button
              key={s.label}
              size="sm"
              variant={status === s.value ? "default" : "outline"}
              onClick={() => setStatus(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
        <AddGoalDialog onCreated={fetchGoals} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-md bg-surface p-0.5">
          {SORTS.map((s) => (
            <Button
              key={s.value}
              size="sm"
              variant={sort === s.value ? "default" : "ghost"}
              className="h-8 px-2.5 text-xs"
              onClick={() => setSort(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
        <Button size="sm" variant={showArchived ? "default" : "outline"} onClick={() => setShowArchived((v) => !v)}>
          {showArchived ? "Showing archived" : "Show archived"}
        </Button>
      </div>

      {goals.length === 0 && !loading ? (
        <EmptyState
          icon={Target}
          title={showArchived ? "No archived goals" : "No goals yet"}
          description={showArchived ? "Goals you archive will show up here." : "Set your first goal and Pulse will track progress toward it."}
          className="py-16"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onChanged={fetchGoals} />
          ))}
        </div>
      )}
    </div>
  );
}
