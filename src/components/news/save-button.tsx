"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

export function SaveButton({ articleId, initialSaved }: { articleId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [justToggled, setJustToggled] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next); // optimistic
    setJustToggled(true);
    setTimeout(() => setJustToggled(false), 200);
    startTransition(async () => {
      const res = await fetch(`/api/articles/${articleId}/save`, { method: next ? "POST" : "DELETE" });
      if (!res.ok) setSaved(!next); // revert on failure
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save article"}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-background",
        saved ? "text-accent-blue" : "text-foreground/40"
      )}
    >
      <Bookmark
        className={cn("h-4 w-4 transition-transform duration-200", justToggled && "scale-125")}
        fill={saved ? "currentColor" : "none"}
      />
    </button>
  );
}
