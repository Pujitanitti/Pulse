import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listSavedArticles } from "@/server/services/library";
import { listSavedArticlesQuerySchema } from "@/server/validation/library";
import { apiError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = listSavedArticlesQuerySchema.safeParse(params);
  if (!parsed.success) return apiValidationError(parsed.error);

  const items = await listSavedArticles(user.id, parsed.data);
  return apiSuccess(items);
});
