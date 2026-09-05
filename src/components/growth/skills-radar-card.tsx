"use client";

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Sparkles } from "lucide-react";
import type { SkillDetail } from "@/server/services/growth";
import { chartTooltipStyle, chartTickStyle } from "@/lib/chart-theme";

export function SkillsRadarCard({ skills }: { skills: SkillDetail[] }) {
  const data = skills.map((s) => ({ name: s.name, level: s.currentLevel, target: s.targetLevel }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skill balance</CardTitle>
      </CardHeader>
      <CardContent>
        {skills.length < 3 ? (
          <EmptyState
            icon={Sparkles}
            title="Add a few more skills"
            description="The radar view needs at least 3 skills to be useful — add more to see the shape of your balance."
          />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="name" tick={chartTickStyle} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                />
                <Radar name="Target" dataKey="target" stroke="hsl(var(--border))" fill="hsl(var(--border))" fillOpacity={0.2} />
                <Radar name="Current" dataKey="level" stroke="hsl(var(--accent-blue))" fill="hsl(var(--accent-blue))" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
