import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listArticles } from "@/server/services/articles";
import { articleListQuerySchema } from "@/server/validation/articles";
import { apiSuccess, apiValidationError } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = articleListQuerySchema.safeParse(params);
  if (!parsed.success) return apiValidationError(parsed.error);

  const user = await getSessionUser();
  const result = await listArticles(parsed.data, user?.id ?? null);
  return apiSuccess(result);
});
