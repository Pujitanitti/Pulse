import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import type { SkillSummary } from "@/server/services/dashboard";

const TREND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus } as const;
const TREND_COLOR = { up: "text-accent-green", down: "text-accent-coral", flat: "text-foreground/30" } as const;

export function SkillsCard({ skills }: { skills: SkillSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
      </CardHeader>
      <CardContent>
        {skills.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Start tracking your growth"
            description="Add a skill to begin building a history of your progress."
          />
        ) : (
          <ul className="space-y-4">
            {skills.map((skill) => {
              const TrendIcon = TREND_ICON[skill.trend];
              return (
                <li key={skill.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{skill.name}</span>
                    <span className="flex items-center gap-1 text-foreground/60">
                      <TrendIcon className={`h-3.5 w-3.5 ${TREND_COLOR[skill.trend]}`} />
                      {skill.currentLevel}%
                    </span>
                  </div>
                  <Progress value={skill.currentLevel} />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
