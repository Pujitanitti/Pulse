"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { integerTicks } from "@/lib/chart-ticks";
import type { LearningAnalytics } from "@/server/services/growth";
import { chartTooltipStyle, chartTickStyle } from "@/lib/chart-theme";

export function LearningAnalyticsCard({ analytics }: { analytics: LearningAnalytics }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Total hours" value={analytics.totalLearningHours.toString()} />
          <StatTile label="Completion rate" value={`${analytics.completionRate}%`} />
          <StatTile label="Avg. rating" value={analytics.averageRating ? `${analytics.averageRating}★` : "—"} />
          <StatTile label="Sessions (7d)" value={analytics.sessionsLast7Days.toString()} />
        </div>

        {analytics.hoursByCategory.length > 0 && (
          <div className="h-48">
            <p className="mb-2 text-xs font-medium text-foreground/50">Hours by category</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.hoursByCategory} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="category" tick={chartTickStyle} axisLine={false} tickLine={false} />
                <YAxis
                  allowDecimals={false}
                  domain={[0, "dataMax"]}
                  ticks={integerTicks(Math.max(...analytics.hoursByCategory.map((c) => c.hours), 1))}
                  tick={chartTickStyle}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                />
                <Bar dataKey="hours" fill="hsl(var(--accent-teal))" radius={[4, 4, 0, 0]} maxBarSize={64} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
