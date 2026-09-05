import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { signupSchema } from "@/server/validation/auth";
import { apiError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { withApiErrorHandling } from "@/lib/api-handler";

export const POST = withApiErrorHandling(async (request: NextRequest) => {
  const limit = rateLimit(`signup:${clientIp(request.headers)}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return apiError("Too many signup attempts. Try again later.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Same message a real "email already exists" case would use elsewhere
    // is fine here (unlike login) because signup existence-leaks are low
    // severity and a precise message meaningfully improves UX.
    return apiError("An account with that email already exists.", 409, {
      email: ["An account with that email already exists."],
    });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      profile: { create: {} },
      preferences: { create: {} },
    },
  });

  await createSession(user.id);

  return apiSuccess({ id: user.id, name: user.name, email: user.email }, 201);
});
