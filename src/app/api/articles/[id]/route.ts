import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getArticleBySlug } from "@/server/services/articles";
import { apiError, apiSuccess } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const GET = withApiErrorHandling(async (_request: Request, { params }: { params: { id: string } }) => {
  const user = await getSessionUser();

  // The route param doubles as either the canonical id (REST-conventional)
  // or the human-readable slug (what article pages actually link to) —
  // resolving id -> slug here keeps the service layer single-purpose.
  const byId = await prisma.article.findUnique({ where: { id: params.id }, select: { slug: true } });
  const slug = byId?.slug ?? params.id;

  const result = await getArticleBySlug(slug, user?.id ?? null);
  if (!result) return apiError("Article not found.", 404);

  return apiSuccess(result);
});
