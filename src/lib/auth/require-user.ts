import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";

/**
 * Call from a Server Component (typically a route-group layout) to enforce
 * authentication. This is the authoritative check — it hits the database
 * and respects revoked/expired sessions immediately. Next.js Middleware
 * (see src/middleware.ts) only does a cheap cookie-presence redirect ahead
 * of this, as an edge runtime can't hold a Postgres connection; this
 * function is what actually decides access.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
