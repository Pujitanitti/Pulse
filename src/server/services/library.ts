import { prisma } from "@/lib/prisma";
import type { ListSavedArticlesQuery, UpdateSavedArticleInput } from "@/server/validation/library";

export class NotFoundError extends Error {}

export interface SavedArticleView {
  id: string;
  articleId: string;
  title: string;
  slug: string;
  category: string;
  source: string;
  folder: string | null;
  notes: string | null;
  isFavorite: boolean;
  isRead: boolean;
  tags: string[];
  savedAt: string;
}

interface SavedArticleRow {
  id: string;
  articleId: string;
  folder: string | null;
  notes: string | null;
  isFavorite: boolean;
  isRead: boolean;
  savedAt: Date;
  article: { title: string; slug: string; category: string; source: string; tags: { name: string }[] };
}

const SORT_CLAUSES: Record<ListSavedArticlesQuery["sort"], object> = {
  recent: { savedAt: "desc" },
  oldest: { savedAt: "asc" },
  title: { article: { title: "asc" } },
};

/**
 * "Saved knowledge" in this schema is scoped to saved articles — folders,
 * notes, and favorites all live on SavedArticle already (added in Phase 1),
 * and article Tags are reused directly rather than introducing a parallel
 * tagging system. A separate freeform "Note" entity isn't modeled: the
 * spec's "save notes" is covered by the notes field already attached to
 * each saved article, and adding a whole standalone notes type for a
 * feature with no other distinguishing behavior would be schema sprawl
 * for its own sake — the same call made for "habits/achievements" in the
 * Phase 5 write-up.
 *
 * Tags are fetched via the normal Prisma relation (article.tags) rather
 * than a raw SQL join through the implicit _ArticleToTag table — one less
 * place tied to a specific database's SQL dialect.
 */
export async function listSavedArticles(userId: string, query: ListSavedArticlesQuery): Promise<SavedArticleView[]> {
  const rows = (await prisma.savedArticle.findMany({
    where: {
      userId,
      ...(query.folder ? { folder: query.folder } : {}),
      ...(query.favorite !== undefined ? { isFavorite: query.favorite } : {}),
      ...(query.search ? { article: { title: { contains: query.search } } } : {}),
    },
    include: { article: { select: { title: true, slug: true, category: true, source: true, tags: { select: { name: true } } } } },
    orderBy: SORT_CLAUSES[query.sort],
  })) as SavedArticleRow[];

  return rows.map((r) => ({
    id: r.id,
    articleId: r.articleId,
    title: r.article.title,
    slug: r.article.slug,
    category: r.article.category,
    source: r.article.source,
    folder: r.folder,
    notes: r.notes,
    isFavorite: r.isFavorite,
    isRead: r.isRead,
    tags: r.article.tags.map((t) => t.name),
    savedAt: r.savedAt.toISOString(),
  }));
}

export async function listFolders(userId: string): Promise<string[]> {
  const rows = (await prisma.savedArticle.findMany({
    where: { userId, folder: { not: null } },
    select: { folder: true },
    distinct: ["folder"],
  })) as { folder: string | null }[];
  return rows.map((r) => r.folder).filter((f): f is string => f !== null).sort();
}

export async function updateSavedArticle(
  userId: string,
  articleId: string,
  input: UpdateSavedArticleInput
): Promise<SavedArticleView> {
  const existing = await prisma.savedArticle.findUnique({ where: { userId_articleId: { userId, articleId } } });
  if (!existing) throw new NotFoundError("Saved article not found.");

  const updated = (await prisma.savedArticle.update({
    where: { userId_articleId: { userId, articleId } },
    data: {
      folder: input.folder,
      notes: input.notes,
      isFavorite: input.isFavorite,
    },
    include: { article: { select: { title: true, slug: true, category: true, source: true, tags: { select: { name: true } } } } },
  })) as SavedArticleRow;

  return {
    id: updated.id,
    articleId: updated.articleId,
    title: updated.article.title,
    slug: updated.article.slug,
    category: updated.article.category,
    source: updated.article.source,
    folder: updated.folder,
    notes: updated.notes,
    isFavorite: updated.isFavorite,
    isRead: updated.isRead,
    tags: updated.article.tags.map((t) => t.name),
    savedAt: updated.savedAt.toISOString(),
  };
}
