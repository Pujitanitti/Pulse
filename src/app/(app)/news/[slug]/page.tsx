import { notFound } from "next/navigation";
import { Clock, Calendar } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { getArticleBySlug } from "@/server/services/articles";
import { Badge } from "@/components/ui/badge";
import { ArticleCard, categoryLabel } from "@/components/news/article-card";
import { SaveButton } from "@/components/news/save-button";
import { ShareButton } from "@/components/news/share-button";
import { ReadingProgress } from "@/components/news/reading-progress";

function whyThisMatters(category: string): string {
  const notes: Record<string, string> = {
    AI: "AI capability and cost curves shift fast enough that assumptions from even six months ago can be stale — worth checking against what's actually shipping today.",
    SOFTWARE_ENGINEERING: "Engineering practices that hold up in production are usually earned the hard way — a real postmortem here is worth more than another best-practices list.",
    STARTUPS: "Funding and hiring patterns at the seed stage are a leading indicator for where engineering talent and opportunity move next.",
    TECHNOLOGY: "Broader technology shifts eventually show up in the tools and platforms engineers use day to day.",
    PRODUCT: "Product decisions upstream shape what engineers get asked to build downstream.",
    BUSINESS: "The business context behind a technical decision usually explains it better than the tech alone.",
    DESIGN: "Interface decisions compound — small restraint choices now avoid larger redesigns later.",
    CYBERSECURITY: "Security incidents elsewhere are the cheapest way to learn what to check in your own systems before it's forced on you.",
  };
  return notes[category] ?? "This connects to broader shifts worth keeping an eye on.";
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const user = await requireUser();
  const result = await getArticleBySlug(params.slug, user.id);
  if (!result) notFound();

  const { article, related } = result;

  return (
    <div className="mx-auto max-w-2xl">
      <ReadingProgress articleId={article.id} />

      <div className="space-y-4">
        <Badge variant="blue">{categoryLabel(article.category)}</Badge>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{article.title}</h1>
        {article.subtitle && <p className="text-lg text-foreground/60">{article.subtitle}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3 text-sm text-foreground/50">
            <span className="font-medium text-foreground/70">{article.author ?? article.source}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(article.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {article.readingTimeMinutes} min read
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ShareButton title={article.title} />
            <SaveButton articleId={article.id} initialSaved={article.isSaved} />
          </div>
        </div>
      </div>

      <div className="mt-8 max-w-none space-y-4 text-base leading-relaxed text-foreground/80">
        <p>{article.content}</p>
      </div>

      <div className="mt-8 rounded-lg border border-accent-blue/20 bg-accent-blue/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-blue">Why this matters</p>
        <p className="mt-2 text-sm text-foreground/70">{whyThisMatters(article.category)}</p>
      </div>

      {related.length > 0 && (
        <div className="mt-12 space-y-4">
          <h2 className="text-sm font-semibold tracking-tight">Related stories</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
