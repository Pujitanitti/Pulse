import { describe, it, expect } from "vitest";
import { z } from "zod";
import { booleanQueryParam } from "@/server/validation/shared";

describe("booleanQueryParam", () => {
  const schema = z.object({ flag: booleanQueryParam() });

  it("parses the literal string 'true' as true", () => {
    expect(schema.parse({ flag: "true" }).flag).toBe(true);
  });

  it("parses the literal string 'false' as false — the exact case z.coerce.boolean() gets wrong", () => {
    expect(schema.parse({ flag: "false" }).flag).toBe(false);
  });

  it("leaves the field undefined when omitted entirely and no default is given", () => {
    expect(schema.parse({}).flag).toBeUndefined();
  });

  it("rejects any value other than the literal strings true/false", () => {
    expect(schema.safeParse({ flag: "yes" }).success).toBe(false);
    expect(schema.safeParse({ flag: "1" }).success).toBe(false);
  });
});

describe("booleanQueryParam with a default", () => {
  const schema = z.object({ flag: booleanQueryParam(false) });

  it("substitutes the default when the field is omitted", () => {
    expect(schema.parse({}).flag).toBe(false);
  });

  it("still parses an explicit 'true' over the default", () => {
    expect(schema.parse({ flag: "true" }).flag).toBe(true);
  });

  it("still correctly parses an explicit 'false' as false, not the JS-truthy bug", () => {
    expect(schema.parse({ flag: "false" }).flag).toBe(false);
  });
});

describe("regression: z.coerce.boolean() would have gotten this wrong", () => {
  it("demonstrates the bug this module exists to avoid", () => {
    const buggySchema = z.coerce.boolean();
    // This is exactly why booleanQueryParam() exists: a client sending the
    // literal query string "false" (e.g. via `URLSearchParams({ flag: String(false) })`,
    // the natural way to serialize a boolean into a query param) would have
    // this silently flipped to `true` by z.coerce.boolean().
    expect(buggySchema.parse("false")).toBe(true);
  });
});
