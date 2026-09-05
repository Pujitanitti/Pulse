import { requireUser } from "@/lib/auth/require-user";
import { listArticles } from "@/server/services/articles";
import { articleListQuerySchema } from "@/server/validation/articles";
import { DiscoveryFeed } from "@/components/news/discovery-feed";

export default async function NewsPage() {
  const user = await requireUser();
  const initial = await listArticles(articleListQuerySchema.parse({}), user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
        <p className="text-sm text-foreground/50">Technology, AI, startups, and engineering — curated for you.</p>
      </div>
      <DiscoveryFeed initial={initial} />
    </div>
  );
}
