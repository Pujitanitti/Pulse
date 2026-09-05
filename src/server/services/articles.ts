import { prisma } from "@/lib/prisma";
import type { ArticleListQuery } from "@/server/validation/articles";

export interface ArticleListItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  source: string;
  author: string | null;
  category: string;
  imageUrl: string | null;
  readingTimeMinutes: number;
  publishedAt: string;
  tags: string[];
  isSaved: boolean;
  isRead: boolean;
}

export interface ArticleListResult {
  articles: ArticleListItem[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  source: string;
  author: string | null;
  category: string;
  imageUrl: string | null;
  readingTimeMinutes: number;
  publishedAt: Date;
}

async function attachSavedStateAndTags(rows: ArticleRow[], userId: string | null): Promise<ArticleListItem[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const [savedRows, tagRows] = await Promise.all([
    userId
      ? (prisma.savedArticle.findMany({
          where: { userId, articleId: { in: ids } },
          select: { articleId: true, isRead: true },
        }) as Promise<{ articleId: string; isRead: boolean }[]>)
      : Promise.resolve([] as { articleId: string; isRead: boolean }[]),
    // Plain relation query rather than a raw join through the implicit
    // _ArticleToTag table — works identically regardless of the underlying
    // database, so there's no SQL dialect to keep portable here.
    prisma.article.findMany({
      where: { id: { in: ids } },
      select: { id: true, tags: { select: { name: true } } },
    }) as Promise<{ id: string; tags: { name: string }[] }[]>,
  ]);

  const savedByArticle = new Map(savedRows.map((s) => [s.articleId, s.isRead]));
  const tagsByArticle = new Map(tagRows.map((r) => [r.id, r.tags.map((t) => t.name)]));

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle,
    source: r.source,
    author: r.author,
    category: r.category,
    imageUrl: r.imageUrl,
    readingTimeMinutes: r.readingTimeMinutes,
    publishedAt: r.publishedAt.toISOString(),
    tags: tagsByArticle.get(r.id) ?? [],
    isSaved: savedByArticle.has(r.id),
    isRead: savedByArticle.get(r.id) ?? false,
  }));
}

const SORT_ORDER: Record<ArticleListQuery["sort"], { field: string; direction: "asc" | "desc" }> = {
  newest: { field: "publishedAt", direction: "desc" },
  oldest: { field: "publishedAt", direction: "asc" },
  quickest: { field: "readingTimeMinutes", direction: "asc" },
};

export async function listArticles(query: ArticleListQuery, userId: string | null): Promise<ArticleListResult> {
  const { search, category, sort, page, pageSize } = query;
  const offset = (page - 1) * pageSize;

  if (search && search.length > 0) {
    // Simple case-insensitive `contains` across title/subtitle/content.
    // The Postgres build of this app used a generated, weighted tsvector
    // column with ts_rank for real relevance-ranked full-text search;
    // SQLite has no equivalent reachable from Prisma, so this is a
    // deliberate simplification for local-dev portability — sorts by
    // recency instead of relevance, with no ranking signal.
    const where = {
      OR: [{ title: { contains: search } }, { subtitle: { contains: search } }, { content: { contains: search } }],
      ...(category ? { category } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.article.findMany({ where, orderBy: { publishedAt: "desc" }, skip: offset, take: pageSize }) as Promise<ArticleRow[]>,
      prisma.article.count({ where }) as Promise<number>,
    ]);

    const articles = await attachSavedStateAndTags(rows, userId);
    return { articles, page, pageSize, total, hasMore: offset + rows.length < total };
  }

  const where = category ? { category } : {};
  const orderBy = { [SORT_ORDER[sort].field]: SORT_ORDER[sort].direction };

  const [rows, total] = await Promise.all([
    prisma.article.findMany({ where, orderBy, skip: offset, take: pageSize }) as Promise<ArticleRow[]>,
    prisma.article.count({ where }) as Promise<number>,
  ]);

  const articles = await attachSavedStateAndTags(rows, userId);
  return { articles, page, pageSize, total, hasMore: offset + rows.length < total };
}

export interface ArticleDetail extends ArticleListItem {
  content: string;
  url: string;
}

export async function getArticleBySlug(
  slug: string,
  userId: string | null
): Promise<{ article: ArticleDetail; related: ArticleListItem[] } | null> {
  const article = (await prisma.article.findUnique({
    where: { slug },
    include: { tags: { select: { name: true } } },
  })) as (ArticleRow & { content: string; url: string; tags: { name: string }[] }) | null;
  if (!article) return null;

  const [saved, relatedRaw] = await Promise.all([
    userId
      ? (prisma.savedArticle.findUnique({
          where: { userId_articleId: { userId, articleId: article.id } },
        }) as Promise<{ isRead: boolean } | null>)
      : Promise.resolve(null),
    prisma.article.findMany({
      where: { category: article.category, id: { not: article.id } },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }) as Promise<ArticleRow[]>,
  ]);

  const related = await attachSavedStateAndTags(relatedRaw, userId);

  return {
    article: {
      id: article.id,
      slug: article.slug,
      title: article.title,
      subtitle: article.subtitle,
      source: article.source,
      author: article.author,
      category: article.category,
      imageUrl: article.imageUrl,
      readingTimeMinutes: article.readingTimeMinutes,
      publishedAt: article.publishedAt.toISOString(),
      tags: article.tags.map((t) => t.name),
      isSaved: saved !== null,
      isRead: saved?.isRead ?? false,
      content: article.content,
      url: article.url,
    },
    related,
  };
}

export async function saveArticle(userId: string, articleId: string): Promise<void> {
  await prisma.savedArticle.upsert({
    where: { userId_articleId: { userId, articleId } },
    create: { userId, articleId },
    update: {},
  });
  await prisma.activity.create({
    data: {
      userId,
      type: "ARTICLE_SAVED",
      title: "Saved an article",
    },
  });
}

export async function unsaveArticle(userId: string, articleId: string): Promise<void> {
  await prisma.savedArticle.deleteMany({ where: { userId, articleId } });
}

export async function markArticleRead(userId: string, articleId: string): Promise<void> {
  await prisma.savedArticle.upsert({
    where: { userId_articleId: { userId, articleId } },
    create: { userId, articleId, isRead: true, readAt: new Date() },
    update: { isRead: true, readAt: new Date() },
  });
}
