import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { addLearningResource, listLearningResourcesFiltered } from "@/server/services/growth";
import { addLearningResourceSchema, listLearningResourcesQuerySchema } from "@/server/validation/growth";
import { apiError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = listLearningResourcesQuerySchema.safeParse(params);
  if (!parsed.success) return apiValidationError(parsed.error);

  const resources = await listLearningResourcesFiltered(user.id, parsed.data);
  return apiSuccess(resources);
});

export const POST = withApiErrorHandling(async (request: Request) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  const body = await request.json().catch(() => null);
  const parsed = addLearningResourceSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const resource = await addLearningResource(user.id, parsed.data);
  return apiSuccess(resource, 201);
});
