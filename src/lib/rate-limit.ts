/**
 * In-memory fixed-window rate limiter, keyed by an arbitrary string
 * (typically `${route}:${ip}`).
 *
 * Deliberate scope: this protects a single Node process, which is fine for
 * local dev and a single-instance deployment. It does NOT coordinate across
 * multiple server instances or serverless invocations — at real scale this
 * map is replaced by a Redis `INCR` + `EXPIRE` (or a managed rate-limiting
 * service) so every instance shares one counter. Documented here rather
 * than hidden, so the tradeoff is explicit for anyone reviewing the code.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

export function clientIp(headerList: Headers): string {
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
