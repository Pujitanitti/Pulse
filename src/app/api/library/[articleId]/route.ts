import { getSessionUser } from "@/lib/auth/session";
import { updateSavedArticle, NotFoundError } from "@/server/services/library";
import { updateSavedArticleSchema } from "@/server/validation/library";
import { apiError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const PATCH = withApiErrorHandling(async (request: Request, { params }: { params: { articleId: string } }) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  const body = await request.json().catch(() => null);
  const parsed = updateSavedArticleSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  try {
    const item = await updateSavedArticle(user.id, params.articleId, parsed.data);
    return apiSuccess(item);
  } catch (e) {
    if (e instanceof NotFoundError) return apiError(e.message, 404);
    throw e;
  }
});
