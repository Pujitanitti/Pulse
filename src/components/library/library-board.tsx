"use client";

import { useEffect, useRef, useState } from "react";
import { Search, BookMarked, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SavedArticleCard } from "@/components/library/saved-article-card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { SavedArticleView } from "@/server/services/library";

const SORTS = [
  { label: "Recent", value: "recent" },
  { label: "Oldest", value: "oldest" },
  { label: "Title", value: "title" },
];

export function LibraryBoard({ initial, folders }: { initial: SavedArticleView[]; folders: string[] }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [folder, setFolder] = useState<string | null>(null);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [sort, setSort] = useState("recent");
  const [items, setItems] = useState(initial);
  const [loading, setLoading] = useState(false);
  const isFirstRun = useRef(true);

  async function fetchItems() {
    setLoading(true);
    const params = new URLSearchParams({ sort });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (folder) params.set("folder", folder);
    if (favoriteOnly) params.set("favorite", "true");
    const res = await fetch(`/api/library?${params.toString()}`);
    const json = await res.json();
    setItems(json.data as SavedArticleView[]);
    setLoading(false);
  }

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, folder, favoriteOnly, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <Input placeholder="Search saved articles…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 rounded-md bg-surface p-0.5">
          {SORTS.map((s) => (
            <Button
              key={s.value}
              size="sm"
              variant={sort === s.value ? "default" : "ghost"}
              className="h-8 px-2.5 text-xs"
              onClick={() => setSort(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={folder === null ? "default" : "outline"} onClick={() => setFolder(null)}>
          All folders
        </Button>
        {folders.map((f) => (
          <Button key={f} size="sm" variant={folder === f ? "default" : "outline"} onClick={() => setFolder(f)}>
            {f}
          </Button>
        ))}
        <Button size="sm" variant={favoriteOnly ? "default" : "outline"} onClick={() => setFavoriteOnly((v) => !v)}>
          <Star className="h-3.5 w-3.5" fill={favoriteOnly ? "currentColor" : "none"} /> Favorites
        </Button>
      </div>

      {items.length === 0 && !loading ? (
        <EmptyState
          icon={BookMarked}
          title="Nothing saved yet"
          description="Save an article from Discover to start building your library."
          className="py-16"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <SavedArticleCard key={item.id} item={item} onChanged={fetchItems} />
          ))}
        </div>
      )}
    </div>
  );
}
