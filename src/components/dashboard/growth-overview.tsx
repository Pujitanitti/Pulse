"use client";

import { useState, useTransition } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { Button } from "@/components/ui/button";
import { integerTicks } from "@/lib/chart-ticks";
import { formatDelta } from "@/lib/format-delta";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/server/services/dashboard";
import { chartTooltipStyle, chartTickStyle } from "@/lib/chart-theme";

const RANGES: { label: string; value: "7" | "30" | "90" | "365" }[] = [
  { label: "7D", value: "7" },
  { label: "30D", value: "30" },
  { label: "90D", value: "90" },
  { label: "1Y", value: "365" },
];

export function GrowthOverview({ initialData }: { initialData: DashboardData["growth"] }) {
  const [growth, setGrowth] = useState(initialData);
  const [activeRange, setActiveRange] = useState<"7" | "30" | "90" | "365">("30");
  const [isPending, startTransition] = useTransition();

  async function handleRangeChange(range: "7" | "30" | "90" | "365") {
    setActiveRange(range);
    startTransition(async () => {
      const res = await fetch(`/api/dashboard?range=${range}`);
      if (!res.ok) return;
      const json = await res.json();
      setGrowth(json.data.growth);
    });
  }

  const totals = growth.totals;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Growth overview</CardTitle>
        <div className="flex gap-1 rounded-md bg-background p-0.5">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={activeRange === r.value ? "default" : "ghost"}
              className="h-7 px-2.5 text-xs"
              onClick={() => handleRangeChange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile
            label="Learning hours"
            value={totals.learningHours.toString()}
            delta={formatDelta(totals.learningHours, growth.previousTotals.learningHours)}
          />
          <StatTile
            label="Goals completed"
            value={totals.goalsCompleted.toString()}
            delta={formatDelta(totals.goalsCompleted, growth.previousTotals.goalsCompleted)}
          />
          <StatTile label="Skills improved" value={totals.skillsImproved.toString()} />
          <StatTile
            label="Articles read"
            value={totals.articlesConsumed.toString()}
            delta={formatDelta(totals.articlesConsumed, growth.previousTotals.articlesConsumed)}
          />
        </div>
        <div className={cn("h-56 transition-opacity", isPending && "opacity-50")}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growth.series} margin={{ top: 4, right: 8, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={chartTickStyle}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, "dataMax"]}
                ticks={integerTicks(Math.max(...growth.series.map((p) => Math.max(p.learningMinutes, p.articlesRead)), 1))}
                tick={chartTickStyle}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
              />
              <Line type="monotone" dataKey="learningMinutes" name="Learning (min)" stroke="hsl(var(--accent-blue))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="articlesRead" name="Articles read" stroke="hsl(var(--accent-teal))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
