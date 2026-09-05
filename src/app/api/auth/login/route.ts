import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/server/validation/auth";
import { apiError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { withApiErrorHandling } from "@/lib/api-handler";

export const POST = withApiErrorHandling(async (request: NextRequest) => {
  const limit = rateLimit(`login:${clientIp(request.headers)}`, 10, 5 * 60 * 1000);
  if (!limit.allowed) {
    return apiError("Too many login attempts. Try again in a few minutes.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // Deliberately identical error for "no such user" and "wrong password" —
  // distinguishing them lets an attacker enumerate registered emails.
  const invalidCredentials = () => apiError("Incorrect email or password.", 401);

  if (!user) return invalidCredentials();

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return invalidCredentials();

  await createSession(user.id);

  return apiSuccess({ id: user.id, name: user.name, email: user.email });
});
