import { getSessionUser } from "@/lib/auth/session";
import { addSkill, listSkills } from "@/server/services/growth";
import { addSkillSchema } from "@/server/validation/growth";
import { apiError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const GET = withApiErrorHandling(async () => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  const skills = await listSkills(user.id);
  return apiSuccess(skills);
});

export const POST = withApiErrorHandling(async (request: Request) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  const body = await request.json().catch(() => null);
  const parsed = addSkillSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const skill = await addSkill(user.id, parsed.data);
  return apiSuccess(skill, 201);
});
