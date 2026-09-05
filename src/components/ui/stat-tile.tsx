export function StatTile({ label, value, delta }: { label: string; value: string; delta?: string | null }) {
  const isPositive = delta?.startsWith("+");
  const isNegative = delta?.startsWith("-");

  return (
    <div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-foreground/50">{label}</p>
      {delta && (
        <p
          className={
            isPositive
              ? "mt-0.5 text-xs font-medium text-accent-green"
              : isNegative
                ? "mt-0.5 text-xs font-medium text-accent-coral"
                : "mt-0.5 text-xs text-foreground/40"
          }
        >
          {delta}
        </p>
      )}
    </div>
  );
}
