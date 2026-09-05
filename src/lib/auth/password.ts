import bcrypt from "bcryptjs";

// Cost factor 12 — a deliberate tradeoff: slow enough to make offline
// brute-forcing of a leaked hash expensive, fast enough (~150-250ms) not to
// bottleneck signup/login under normal load. Revisit if auth throughput
// ever becomes the hot path (see README → "What would change at 1M users").
const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
