import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { globalSearch } from "@/server/services/search";
import { globalSearchQuerySchema } from "@/server/validation/search";
import { apiError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = globalSearchQuerySchema.safeParse(params);
  if (!parsed.success) return apiValidationError(parsed.error);

  const results = await globalSearch(user.id, parsed.data.q);
  return apiSuccess(results);
});
