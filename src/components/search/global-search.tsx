"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import type { GlobalSearchResult } from "@/server/services/search";

const SECTIONS: { key: keyof Omit<GlobalSearchResult, "query" | "totalCount">; label: string }[] = [
  { key: "articles", label: "Articles" },
  { key: "resources", label: "Learning" },
  { key: "skills", label: "Skills" },
  { key: "goals", label: "Goals" },
];

export function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults(null);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((json) => setResults(json.data as GlobalSearchResult))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const showPanel = open && query.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Search everything…"
        className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
      />

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-border bg-background shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-foreground/40">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          ) : !results || results.totalCount === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-foreground/40">No results for &ldquo;{query}&rdquo;.</p>
          ) : (
            <div className="py-2">
              {SECTIONS.map(({ key, label }) => {
                const items = results[key];
                if (items.length === 0) return null;
                return (
                  <div key={key} className="px-2 py-1">
                    <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-foreground/40">{label}</p>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => go(item.href)}
                        className={cn(
                          "flex w-full flex-col rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface"
                        )}
                      >
                        <span className="truncate">{item.title}</span>
                        {item.subtitle && <span className="text-xs text-foreground/40">{item.subtitle}</span>}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
