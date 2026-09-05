import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HeatmapPoint } from "@/server/services/growth";

function intensity(minutes: number): string {
  if (minutes === 0) return "bg-border";
  if (minutes < 20) return "bg-accent-blue/25";
  if (minutes < 45) return "bg-accent-blue/55";
  return "bg-accent-blue";
}

function formatHeatmapDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ActivityHeatmapCard({ heatmap }: { heatmap: HeatmapPoint[] }) {
  // Group into weeks (columns), Sunday-start, for a GitHub-style grid.
  const weeks: HeatmapPoint[][] = [];
  let currentWeek: HeatmapPoint[] = [];
  for (const point of heatmap) {
    const day = new Date(point.date).getUTCDay();
    if (day === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(point);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((week, i) => (
            <div key={i} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${formatHeatmapDate(day.date)} — ${day.minutes} min`}
                  role="img"
                  aria-label={`${formatHeatmapDate(day.date)}: ${day.minutes} minutes of learning`}
                  className={cn("h-3 w-3 rounded-sm transition-transform hover:scale-125", intensity(day.minutes))}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-foreground/40">
          <span>Less</span>
          <div className="h-3 w-3 rounded-sm bg-border" />
          <div className="h-3 w-3 rounded-sm bg-accent-blue/25" />
          <div className="h-3 w-3 rounded-sm bg-accent-blue/55" />
          <div className="h-3 w-3 rounded-sm bg-accent-blue" />
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
