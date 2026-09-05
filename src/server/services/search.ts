import { prisma } from "@/lib/prisma";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

export interface GlobalSearchResult {
  query: string;
  articles: SearchResultItem[];
  resources: SearchResultItem[];
  skills: SearchResultItem[];
  goals: SearchResultItem[];
  totalCount: number;
}

const RESULTS_PER_ENTITY = 5;

/**
 * All four entities use a simple case-insensitive `contains` here. The
 * Postgres build of this app additionally used a real weighted tsvector
 * index for articles specifically (title/subtitle ranked above body
 * matches); SQLite has no equivalent reachable from Prisma, so this
 * version treats article search the same way as the other three —
 * simpler, and appropriate for a small local seed dataset, at the cost of
 * the relevance-ranking Postgres provided.
 */
export async function globalSearch(userId: string, query: string): Promise<GlobalSearchResult> {
  const [articleRows, resourceRows, skillRows, goalRows] = await Promise.all([
    prisma.article.findMany({
      where: {
        OR: [{ title: { contains: query } }, { subtitle: { contains: query } }, { content: { contains: query } }],
      },
      select: { id: true, slug: true, title: true, category: true },
      orderBy: { publishedAt: "desc" },
      take: RESULTS_PER_ENTITY,
    }) as Promise<{ id: string; slug: string; title: string; category: string }[]>,
    prisma.learningResource.findMany({
      where: { userId, title: { contains: query } },
      select: { id: true, title: true, type: true },
      take: RESULTS_PER_ENTITY,
    }) as Promise<{ id: string; title: string; type: string }[]>,
    prisma.skill.findMany({
      where: { userId, name: { contains: query } },
      select: { id: true, name: true, currentLevel: true },
      take: RESULTS_PER_ENTITY,
    }) as Promise<{ id: string; name: string; currentLevel: number }[]>,
    prisma.goal.findMany({
      where: {
        userId,
        OR: [{ title: { contains: query } }, { description: { contains: query } }],
      },
      select: { id: true, title: true, status: true },
      take: RESULTS_PER_ENTITY,
    }) as Promise<{ id: string; title: string; status: string }[]>,
  ]);

  const articles: SearchResultItem[] = articleRows.map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: a.category,
    href: `/news/${a.slug}`,
  }));
  const resources: SearchResultItem[] = resourceRows.map((r) => ({
    id: r.id,
    title: r.title,
    subtitle: r.type,
    href: `/learning`,
  }));
  const skills: SearchResultItem[] = skillRows.map((s) => ({
    id: s.id,
    title: s.name,
    subtitle: `${s.currentLevel}%`,
    href: `/growth`,
  }));
  const goals: SearchResultItem[] = goalRows.map((g) => ({
    id: g.id,
    title: g.title,
    subtitle: g.status,
    href: `/goals`,
  }));

  return {
    query,
    articles,
    resources,
    skills,
    goals,
    totalCount: articles.length + resources.length + skills.length + goals.length,
  };
}
