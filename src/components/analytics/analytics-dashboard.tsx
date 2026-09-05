"use client";

import { useState, useTransition } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PieChart as PieChartIcon } from "lucide-react";
import { integerTicks } from "@/lib/chart-ticks";
import { cn } from "@/lib/utils";
import type { AnalyticsData } from "@/server/services/analytics";
import { chartTooltipStyle, chartTickStyle } from "@/lib/chart-theme";

const RANGES: { label: string; value: "7" | "30" | "90" | "365" }[] = [
  { label: "7D", value: "7" },
  { label: "30D", value: "30" },
  { label: "90D", value: "90" },
  { label: "1Y", value: "365" },
];

const CATEGORY_COLORS = [
  "hsl(var(--accent-blue))",
  "hsl(var(--accent-teal))",
  "hsl(var(--accent-coral))",
  "hsl(var(--accent-green))",
  "hsl(var(--foreground) / 0.5)",
  "hsl(var(--foreground) / 0.3)",
  "hsl(var(--foreground) / 0.7)",
  "hsl(var(--foreground) / 0.2)",
];

function categoryLabel(category: string): string {
  return category
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

export function AnalyticsDashboard({ initial }: { initial: AnalyticsData }) {
  const [data, setData] = useState(initial);
  const [range, setRange] = useState<"7" | "30" | "90" | "365">("30");
  const [isPending, startTransition] = useTransition();

  function handleRangeChange(next: "7" | "30" | "90" | "365") {
    setRange(next);
    startTransition(async () => {
      const res = await fetch(`/api/analytics?range=${next}`);
      if (!res.ok) return;
      const json = await res.json();
      setData(json.data as AnalyticsData);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex gap-1 rounded-md bg-surface p-0.5">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={range === r.value ? "default" : "ghost"}
              className="h-8 px-2.5 text-xs"
              onClick={() => handleRangeChange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      <div className={cn("space-y-6 transition-opacity", isPending && "opacity-50")}>
        {/* Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatTile label="Skills improved" value={data.growth.skillsImproved.toString()} />
              <StatTile label="Skill points gained" value={data.growth.totalSkillPointsGained.toString()} />
              <StatTile label="Goals completed" value={data.growth.goalsCompleted.toString()} />
              <StatTile label="Consistency" value={`${data.growth.consistencyPercent}%`} />
            </div>
            <div className="mb-4 flex gap-6 text-sm text-foreground/60">
              <span>
                Current streak: <span className="font-medium text-foreground">{data.growth.currentStreak} days</span>
              </span>
              <span>
                Longest in window: <span className="font-medium text-foreground">{data.growth.longestStreakInRange} days</span>
              </span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.growth.learningMinutesSeries} margin={{ top: 4, right: 8, left: -4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={chartTickStyle} axisLine={false} tickLine={false} />
                  <YAxis
                    allowDecimals={false}
                    domain={[0, "dataMax"]}
                    ticks={integerTicks(Math.max(...data.growth.learningMinutesSeries.map((p) => p.minutes), 1))}
                    tick={chartTickStyle}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                  />
                  <Line type="monotone" dataKey="minutes" name="Learning minutes" stroke="hsl(var(--accent-blue))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge */}
        <Card>
          <CardHeader>
            <CardTitle>Knowledge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatTile label="Articles read" value={data.knowledge.articlesRead.toString()} />
              <StatTile label="Articles saved" value={data.knowledge.articlesSaved.toString()} />
            </div>
            {data.knowledge.categoriesConsumed.length === 0 ? (
              <EmptyState icon={PieChartIcon} title="Nothing read yet" description="Mark articles as read in Discover to see a category breakdown here." />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.knowledge.categoriesConsumed}
                      dataKey="count"
                      nameKey="category"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {data.knowledge.categoriesConsumed.map((entry, i) => (
                        <Cell key={entry.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, _name, entry) => [value, categoryLabel(entry.payload.category)]}
                      contentStyle={chartTooltipStyle}
                    />
                    <Legend
                      formatter={(value: string) => categoryLabel(value)}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Productivity */}
        <Card>
          <CardHeader>
            <CardTitle>Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatTile label="Learning sessions" value={data.productivity.learningSessions.toString()} />
              <StatTile label="Active goals" value={data.productivity.activeGoals.toString()} />
              <StatTile label="Completion rate" value={`${data.productivity.completionRate}%`} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
