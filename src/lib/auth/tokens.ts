import { randomBytes, createHash } from "node:crypto";

/**
 * Generates a high-entropy opaque token (256 bits) suitable for use as a
 * session cookie value or a password-reset link parameter.
 *
 * Design: the RAW token is what's handed to the client (cookie or emailed
 * link) and is never persisted. Only its SHA-256 hash is stored in the
 * database. This means a database leak alone cannot be used to impersonate
 * a session or reset a password — the attacker would still need the raw
 * token, which only ever existed in the client's cookie jar or inbox.
 * A fast hash (vs. bcrypt) is intentional here: unlike passwords, these
 * tokens have 256 bits of entropy and are never subject to offline
 * dictionary attacks, so bcrypt's deliberate slowness buys nothing and
 * would only add latency to every authenticated request.
 */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
