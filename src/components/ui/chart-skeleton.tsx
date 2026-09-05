export function ChartCardSkeleton({ heightClass = "h-64" }: { heightClass?: string }) {
  return (
    <div className={`animate-pulse rounded-lg border border-border bg-surface ${heightClass}`}>
      <div className="space-y-3 p-5">
        <div className="h-4 w-32 rounded bg-border" />
        <div className="h-3 w-48 rounded bg-border" />
      </div>
    </div>
  );
}
