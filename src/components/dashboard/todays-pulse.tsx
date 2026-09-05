import { Flame, Target, Clock } from "lucide-react";
import type { DashboardData } from "@/server/services/dashboard";

export function TodaysPulse({ pulse }: { pulse: DashboardData["todaysPulse"] }) {
  const items = [
    { icon: Flame, label: "Day streak", value: pulse.streakDays.toString() },
    { icon: Target, label: "Active goals", value: pulse.activeGoalsCount.toString() },
    { icon: Clock, label: "Minutes today", value: pulse.learningMinutesToday.toString() },
  ];

  return (
    <div className="flex flex-wrap gap-6 rounded-lg border border-border bg-surface px-5 py-4">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background">
            <Icon className="h-4 w-4 text-accent-blue" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">{value}</p>
            <p className="mt-0.5 text-xs text-foreground/50">{label}</p>
          </div>
        </div>
      ))}
      {pulse.topStory && (
        <div className="ml-auto text-right text-xs text-foreground/50">
          Today&apos;s top story: <span className="font-medium text-foreground">{pulse.topStory.title}</span>
        </div>
      )}
    </div>
  );
}
