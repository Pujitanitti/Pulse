"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { integerTicks } from "@/lib/chart-ticks";
import type { MonthlyGrowthPoint } from "@/server/services/growth";
import { chartTooltipStyle, chartTickStyle } from "@/lib/chart-theme";

export function MonthlyGrowthCard({ data }: { data: MonthlyGrowthPoint[] }) {
  const maxHours = Math.max(...data.map((d) => d.learningHours), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly growth</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={chartTickStyle} axisLine={false} tickLine={false} />
              <YAxis
                allowDecimals={false}
                domain={[0, "dataMax"]}
                ticks={integerTicks(maxHours)}
                tick={chartTickStyle}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="learningHours" name="Learning hours" fill="hsl(var(--accent-blue))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
