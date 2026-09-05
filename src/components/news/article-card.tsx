import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SaveButton } from "@/components/news/save-button";
import type { ArticleListItem } from "@/server/services/articles";

export function categoryLabel(category: string): string {
  return category
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

export function ArticleCard({ article }: { article: ArticleListItem }) {
  return (
    <div className="group relative rounded-lg border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-blue/40 hover:shadow-md">
      <Link href={`/news/${article.slug}`} className="block space-y-2 pr-8">
        <div className="flex items-center gap-2">
          <Badge variant="blue">{categoryLabel(article.category)}</Badge>
          {article.isRead && <Badge variant="green">Read</Badge>}
        </div>
        <h3 className="text-sm font-medium leading-snug group-hover:text-accent-blue">{article.title}</h3>
        {article.subtitle && <p className="line-clamp-2 text-xs text-foreground/50">{article.subtitle}</p>}
        <div className="flex items-center gap-3 text-xs text-foreground/40">
          <span>{article.source}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {article.readingTimeMinutes} min
          </span>
        </div>
      </Link>
      <div className="absolute right-3 top-3">
        <SaveButton articleId={article.id} initialSaved={article.isSaved} />
      </div>
    </div>
  );
}
