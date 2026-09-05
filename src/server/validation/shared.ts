import { z } from "zod";

/**
 * `z.coerce.boolean()` is a footgun for query parameters: it coerces via
 * JS's `Boolean(value)`, and `Boolean("false")` is `true` — any non-empty
 * string is truthy. A client that explicitly sends `?flag=false` (as
 * `URLSearchParams({ flag: String(someBoolean) })` naturally does) gets
 * silently treated as `true` server-side. This parses the literal strings
 * "true"/"false" instead.
 *
 * The default is baked into the transform itself rather than chained via
 * `.default()` afterwards — Zod's `.default()` on a post-transform schema
 * expects a value of the *pre-transform* input type ("true" | "false"),
 * not the transformed output type (boolean), which doesn't type-check for
 * a plain `boolean` default. Two overloads give the caller a precise
 * `boolean` (when a default is supplied) or `boolean | undefined` (when
 * the field should stay genuinely optional).
 */
export function booleanQueryParam(): z.ZodEffects<z.ZodOptional<z.ZodEnum<["true", "false"]>>, boolean | undefined>;
export function booleanQueryParam(defaultValue: boolean): z.ZodEffects<z.ZodOptional<z.ZodEnum<["true", "false"]>>, boolean>;
export function booleanQueryParam(defaultValue?: boolean) {
  return z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? defaultValue : v === "true"));
}
