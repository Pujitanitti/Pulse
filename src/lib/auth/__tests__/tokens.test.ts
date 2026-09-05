import { describe, it, expect } from "vitest";
import { generateOpaqueToken, hashToken } from "@/lib/auth/tokens";

describe("opaque tokens", () => {
  it("generates high-entropy, URL-safe tokens", () => {
    const token = generateOpaqueToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generates a different token on every call", () => {
    const seen = new Set(Array.from({ length: 1000 }, () => generateOpaqueToken()));
    expect(seen.size).toBe(1000);
  });

  it("hashes deterministically (same input -> same hash)", () => {
    const token = generateOpaqueToken();
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("produces different hashes for different tokens", () => {
    const a = generateOpaqueToken();
    const b = generateOpaqueToken();
    expect(hashToken(a)).not.toBe(hashToken(b));
  });

  it("hash cannot be trivially reversed to recover the raw token", () => {
    const token = generateOpaqueToken();
    const hash = hashToken(token);
    expect(hash).not.toContain(token);
    expect(hash).toHaveLength(64); // sha256 hex digest
  });
});
