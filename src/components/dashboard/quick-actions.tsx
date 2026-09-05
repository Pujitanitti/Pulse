import Link from "next/link";
import { Clock, Target, Compass, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTIONS = [
  { href: "/growth", label: "Log a session", icon: Clock },
  { href: "/goals", label: "Create a goal", icon: Target },
  { href: "/news", label: "Explore", icon: Compass },
  { href: "/analytics", label: "View analytics", icon: BarChart3 },
];

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium",
            "transition-colors hover:border-accent-blue/40 hover:text-accent-blue"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Link>
      ))}
    </div>
  );
}
