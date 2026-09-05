"use client";

import { useEffect, useRef, useState } from "react";

export function ReadingProgress({ articleId }: { articleId: string }) {
  const [progress, setProgress] = useState(0);
  const hasMarkedRead = useRef(false);

  useEffect(() => {
    function onScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      const clamped = Math.min(100, Math.max(0, pct));
      setProgress(clamped);

      if (clamped > 80 && !hasMarkedRead.current) {
        hasMarkedRead.current = true;
        fetch(`/api/articles/${articleId}/read`, { method: "POST" }).catch(() => {
          hasMarkedRead.current = false; // allow retry on next scroll if the request failed
        });
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [articleId]);

  return (
    <div className="fixed left-0 top-0 z-50 h-0.5 w-full bg-border">
      <div className="h-full bg-accent-blue transition-[width]" style={{ width: `${progress}%` }} />
    </div>
  );
}
