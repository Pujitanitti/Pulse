import { describe, it, expect } from "vitest";
import { signupSchema, loginSchema, resetPasswordSchema } from "@/server/validation/auth";

describe("signupSchema", () => {
  it("accepts a valid signup payload", () => {
    const result = signupSchema.safeParse({ name: "Pujita Nitti", email: "Pujita@Example.com", password: "Secure123" });
    expect(result.success).toBe(true);
    if (result.success) {
      // email is normalized to lowercase
      expect(result.data.email).toBe("pujita@example.com");
    }
  });

  it("rejects a password with no uppercase letter", () => {
    const result = signupSchema.safeParse({ name: "A B", email: "a@b.com", password: "secure123" });
    expect(result.success).toBe(false);
  });

  it("rejects a password with no digit", () => {
    const result = signupSchema.safeParse({ name: "A B", email: "a@b.com", password: "SecurePass" });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signupSchema.safeParse({ name: "A B", email: "a@b.com", password: "Ab1" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signupSchema.safeParse({ name: "A B", email: "not-an-email", password: "Secure123" });
    expect(result.success).toBe(false);
  });

  it("rejects a name that's too short", () => {
    const result = signupSchema.safeParse({ name: "A", email: "a@b.com", password: "Secure123" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts any non-empty password (strength is only enforced at signup/reset)", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "x" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("requires both a token and a strong password", () => {
    const result = resetPasswordSchema.safeParse({ token: "abc", password: "Secure123" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing token", () => {
    const result = resetPasswordSchema.safeParse({ token: "", password: "Secure123" });
    expect(result.success).toBe(false);
  });
});
