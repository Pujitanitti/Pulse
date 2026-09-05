import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-10 text-center", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
        <Icon className="h-5 w-5 text-foreground/40" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-foreground/50">{description}</p>
      </div>
      {action}
    </div>
  );
}
