"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, Newspaper } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ArticleCard, categoryLabel } from "@/components/news/article-card";
import { FeaturedArticleCard } from "@/components/news/featured-article-card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import type { ArticleListItem, ArticleListResult } from "@/server/services/articles";

const CATEGORIES = ["TECHNOLOGY", "AI", "STARTUPS", "SOFTWARE_ENGINEERING", "PRODUCT", "BUSINESS", "DESIGN", "CYBERSECURITY"];
const SORTS = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Quickest read", value: "quickest" },
];

export function DiscoveryFeed({ initial }: { initial: ArticleListResult }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState("newest");
  const [articles, setArticles] = useState<ArticleListItem[]>(initial.articles);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initial.total);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loading, setLoading] = useState(false);
  const isFirstRun = useRef(true);

  async function fetchPage(pageNum: number, replace: boolean) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pageNum), pageSize: "12", sort });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (category) params.set("category", category);

    const res = await fetch(`/api/articles?${params.toString()}`);
    const json = await res.json();
    const data = json.data as ArticleListResult;

    setArticles((prev) => (replace ? data.articles : [...prev, ...data.articles]));
    setTotal(data.total);
    setHasMore(data.hasMore);
    setPage(pageNum);
    setLoading(false);
  }

  // Refetch from page 1 whenever filters change.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, sort]);

  const featured = page === 1 && !debouncedSearch && !category && articles[0];
  const gridArticles = featured ? articles.slice(1) : articles;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <Input
            placeholder="Search articles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
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

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={category === null ? "default" : "outline"} onClick={() => setCategory(null)}>
          All
        </Button>
        {CATEGORIES.map((c) => (
          <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)}>
            {categoryLabel(c)}
          </Button>
        ))}
      </div>

      {articles.length === 0 && !loading ? (
        <EmptyState
          icon={Newspaper}
          title="No stories found"
          description="Try a different search term or category."
          className="py-20"
        />
      ) : (
        <div className={cn("transition-opacity", loading && page === 1 && "opacity-50")}>
          {featured && <FeaturedArticleCard article={featured} />}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gridArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => fetchPage(page + 1, false)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Load more (${articles.length} of ${total})`}
          </Button>
        </div>
      )}
    </div>
  );
}
