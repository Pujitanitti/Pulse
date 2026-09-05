import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { RecommendedArticle } from "@/server/services/dashboard";

function categoryLabel(category: string): string {
  return category
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

export function RecommendedReadingCard({ articles }: { articles: RecommendedArticle[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended reading</CardTitle>
      </CardHeader>
      <CardContent>
        {articles.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Your reading list is waiting for its first story."
            description="Set your interests in Settings to get personalized picks here."
          />
        ) : (
          <ul className="space-y-4">
            {articles.map((article) => (
              <li key={article.id}>
                <Link href={`/news/${article.slug}`} className="group block space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="blue">{categoryLabel(article.category)}</Badge>
                    <span className="flex items-center gap-1 text-xs text-foreground/40">
                      <Clock className="h-3 w-3" />
                      {article.readingTimeMinutes} min
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-snug group-hover:text-accent-blue">{article.title}</p>
                  {article.subtitle && <p className="text-xs text-foreground/50 line-clamp-1">{article.subtitle}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
