import { getSessionUser } from "@/lib/auth/session";
import { saveArticle, unsaveArticle } from "@/server/services/articles";
import { apiError, apiSuccess } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const POST = withApiErrorHandling(async (_request: Request, { params }: { params: { id: string } }) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  await saveArticle(user.id, params.id);
  return apiSuccess({ saved: true });
});

export const DELETE = withApiErrorHandling(async (_request: Request, { params }: { params: { id: string } }) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  await unsaveArticle(user.id, params.id);
  return apiSuccess({ saved: false });
});
