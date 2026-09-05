import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listGoals, createGoal } from "@/server/services/goals";
import { createGoalSchema, listGoalsQuerySchema } from "@/server/validation/goals";
import { apiError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = listGoalsQuerySchema.safeParse(params);
  if (!parsed.success) return apiValidationError(parsed.error);

  const goals = await listGoals(user.id, parsed.data);
  return apiSuccess(goals);
});

export const POST = withApiErrorHandling(async (request: Request) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  const body = await request.json().catch(() => null);
  const parsed = createGoalSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const goal = await createGoal(user.id, parsed.data);
  return apiSuccess(goal, 201);
});
