import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("hashes a password to a bcrypt string distinct from the plaintext", async () => {
    const hash = await hashPassword("Correcthorse1");
    expect(hash).not.toBe("Correcthorse1");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("verifies the correct password against its hash", async () => {
    const hash = await hashPassword("Correcthorse1");
    await expect(verifyPassword("Correcthorse1", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("Correcthorse1");
    await expect(verifyPassword("WrongPassword1", hash)).resolves.toBe(false);
  });

  it("produces a different hash each time (unique salts)", async () => {
    const [a, b] = await Promise.all([hashPassword("Correcthorse1"), hashPassword("Correcthorse1")]);
    expect(a).not.toBe(b);
  });
});
