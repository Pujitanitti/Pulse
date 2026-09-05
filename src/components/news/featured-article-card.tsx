import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SaveButton } from "@/components/news/save-button";
import { categoryLabel } from "@/components/news/article-card";
import type { ArticleListItem } from "@/server/services/articles";

export function FeaturedArticleCard({ article }: { article: ArticleListItem }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-foreground text-background transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_hsl(var(--accent-blue)/0.4),_transparent_60%)]" />
      <Link href={`/news/${article.slug}`} className="relative flex flex-col gap-4 p-8 sm:p-10">
        <Badge variant="blue" className="w-fit bg-background/10 text-background">
          Featured &middot; {categoryLabel(article.category)}
        </Badge>
        <h2 className="max-w-2xl text-2xl font-semibold leading-snug sm:text-3xl">{article.title}</h2>
        {article.subtitle && <p className="max-w-xl text-background/70">{article.subtitle}</p>}
        <div className="flex items-center gap-3 text-sm text-background/50">
          <span>{article.source}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {article.readingTimeMinutes} min read
          </span>
        </div>
      </Link>
      <div className="absolute right-6 top-6">
        <div className="rounded-full bg-background/10 [&_button]:text-background">
          <SaveButton articleId={article.id} initialSaved={article.isSaved} />
        </div>
      </div>
    </div>
  );
}
