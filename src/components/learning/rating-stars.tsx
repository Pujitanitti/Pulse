"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({ value, onChange, disabled }: { value: number | null; onChange: (rating: number) => void; disabled?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const [justSelected, setJustSelected] = useState<number | null>(null);
  const active = hover ?? value ?? 0;

  function handleSelect(n: number) {
    onChange(n);
    setJustSelected(n);
    setTimeout(() => setJustSelected(null), 200);
  }

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onMouseEnter={() => setHover(n)}
          onClick={() => handleSelect(n)}
          aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
          className="disabled:cursor-not-allowed"
        >
          <Star
            className={cn(
              "h-4 w-4 transition-transform duration-150",
              n <= active ? "fill-accent-coral text-accent-coral" : "text-foreground/20",
              justSelected !== null && n <= justSelected && "scale-125"
            )}
          />
        </button>
      ))}
    </div>
  );
}
