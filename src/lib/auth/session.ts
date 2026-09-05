import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateOpaqueToken, hashToken } from "@/lib/auth/tokens";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "pulse_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Creates a new server-side session for a user and sets the session cookie
 * on the current response. Returns the raw token (rarely needed by callers
 * beyond tests, since the cookie is already set).
 */
export async function createSession(userId: string): Promise<string> {
  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const headerList = headers();
  const userAgent = headerList.get("user-agent") ?? undefined;
  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;

  await prisma.session.create({
    data: { userId, tokenHash, expiresAt, userAgent, ipAddress },
  });

  cookies().set(COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return rawToken;
}

/**
 * Resolves the current request's session cookie to a user, validating
 * expiry against the database (the source of truth — logging out or an
 * admin revoking a session takes effect immediately, unlike a stateless
 * JWT which would remain valid until it expires on its own).
 *
 * Wrapped in React's `cache()`: every page under `(app)/layout.tsx` calls
 * `requireUser()` again on top of the layout's own call, which — without
 * this — meant two separate session-validation round trips to Postgres on
 * every single page load. `cache()` memoizes the result per request/render
 * pass (not across requests, so there's no stale-session risk), collapsing
 * that back down to one query.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const rawToken = cookies().get(COOKIE_NAME)?.value;
  if (!rawToken) return null;

  const tokenHash = hashToken(rawToken);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
});

export async function destroyCurrentSession(): Promise<void> {
  const rawToken = cookies().get(COOKIE_NAME)?.value;
  if (rawToken) {
    const tokenHash = hashToken(rawToken);
    await prisma.session.deleteMany({ where: { tokenHash } });
  }
  cookies().delete(COOKIE_NAME);
}

/** Invalidates every session for a user — used after a password reset. */
export async function destroyAllSessionsForUser(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

export { COOKIE_NAME };
