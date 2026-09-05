"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { postJson } from "@/lib/api-client";
import type { GoalView } from "@/server/services/goals";

export function MilestoneList({ goal, onChanged }: { goal: GoalView; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function toggle(milestoneId: string, completed: boolean) {
    setBusy(true);
    await fetch(`/api/goals/${goal.id}/milestones/${milestoneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    setBusy(false);
    onChanged();
  }

  async function removeMilestone(milestoneId: string) {
    setBusy(true);
    await fetch(`/api/goals/${goal.id}/milestones/${milestoneId}`, { method: "DELETE" });
    setBusy(false);
    onChanged();
  }

  async function addMilestone() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await postJson(`/api/goals/${goal.id}/milestones`, { title: title.trim() });
      setTitle("");
      setAdding(false);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {goal.milestones.map((m) => (
        <div key={m.id} className="group flex items-center gap-2">
          <button
            type="button"
            role="checkbox"
            aria-checked={m.completed}
            aria-label={m.completed ? `Mark "${m.title}" as not completed` : `Mark "${m.title}" as completed`}
            onClick={() => toggle(m.id, !m.completed)}
            disabled={busy}
            className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
              m.completed ? "border-accent-blue bg-accent-blue text-background" : "border-border"
            )}
          >
            {m.completed && "✓"}
          </button>
          <span className={cn("flex-1 text-sm", m.completed && "text-foreground/40 line-through")}>{m.title}</span>
          <button
            type="button"
            onClick={() => removeMilestone(m.id)}
            aria-label={`Delete milestone "${m.title}"`}
            className="text-foreground/30 opacity-0 hover:text-accent-coral group-hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMilestone()}
            placeholder="New milestone"
            className="h-8"
          />
          <button type="button" onClick={addMilestone} className="text-xs text-accent-blue hover:underline">
            Add
          </button>
          <button type="button" onClick={() => setAdding(false)} className="text-xs text-foreground/40 hover:underline">
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-foreground/50 hover:text-accent-blue"
        >
          <Plus className="h-3 w-3" /> Add milestone
        </button>
      )}
    </div>
  );
}
