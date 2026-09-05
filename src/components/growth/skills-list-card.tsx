"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Sparkles } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { AddSkillDialog } from "@/components/growth/add-skill-dialog";
import { cn } from "@/lib/utils";
import type { SkillDetail } from "@/server/services/growth";
import { chartTooltipStyle, chartTickStyle } from "@/lib/chart-theme";

function SkillRow({ skill }: { skill: SkillDetail }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [level, setLevel] = useState(skill.currentLevel);
  const [saving, setSaving] = useState(false);

  async function saveLevel() {
    setSaving(true);
    await fetch(`/api/skills/${skill.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentLevel: level }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  const chartData = skill.history.map((h) => ({
    date: new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    level: h.level,
  }));

  return (
    <li className="space-y-2 border-b border-border pb-4 last:border-0 last:pb-0">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{skill.name}</span>
            <span className="text-foreground/50">{skill.currentLevel}%</span>
          </div>
          <Progress value={skill.currentLevel} />
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-foreground/40 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="space-y-3 pt-1">
          {chartData.length > 1 ? (
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--foreground) / 0.5)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--foreground) / 0.5)" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                  />
                  <Line type="monotone" dataKey="level" stroke="hsl(var(--accent-blue))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-foreground/40">Update the level a couple of times to see a history chart.</p>
          )}

          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="h-8 w-20"
              />
              <Button size="sm" onClick={saveLevel} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Update level
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

export function SkillsListCard({ skills }: { skills: SkillDetail[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Skills</CardTitle>
        <AddSkillDialog />
      </CardHeader>
      <CardContent>
        {skills.length === 0 ? (
          <EmptyState icon={Sparkles} title="Start tracking your growth" description="Add a skill to begin building a history of your progress." />
        ) : (
          <ul>
            {skills.map((s) => (
              <SkillRow key={s.id} skill={s} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
