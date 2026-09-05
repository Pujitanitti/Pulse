import { describe, it, expect } from "vitest";
import { listSavedArticlesQuerySchema, updateSavedArticleSchema } from "@/server/validation/library";
import { globalSearchQuerySchema } from "@/server/validation/search";
import { articleListQuerySchema } from "@/server/validation/articles";

describe("listSavedArticlesQuerySchema", () => {
  it("defaults sort to 'recent' and leaves favorite undefined when omitted", () => {
    const result = listSavedArticlesQuerySchema.parse({});
    expect(result.sort).toBe("recent");
    expect(result.favorite).toBeUndefined();
  });

  it("correctly parses favorite=false as false, not true", () => {
    expect(listSavedArticlesQuerySchema.parse({ favorite: "false" }).favorite).toBe(false);
  });

  it("correctly parses favorite=true as true", () => {
    expect(listSavedArticlesQuerySchema.parse({ favorite: "true" }).favorite).toBe(true);
  });
});

describe("updateSavedArticleSchema", () => {
  it("accepts clearing the folder with an explicit null", () => {
    expect(updateSavedArticleSchema.safeParse({ folder: null }).success).toBe(true);
  });

  it("rejects a folder name over 60 characters", () => {
    expect(updateSavedArticleSchema.safeParse({ folder: "x".repeat(61) }).success).toBe(false);
  });
});

describe("globalSearchQuerySchema", () => {
  it("rejects an empty search query", () => {
    expect(globalSearchQuerySchema.safeParse({ q: "" }).success).toBe(false);
  });

  it("accepts a normal query", () => {
    expect(globalSearchQuerySchema.safeParse({ q: "rust" }).success).toBe(true);
  });

  it("rejects a query over 200 characters", () => {
    expect(globalSearchQuerySchema.safeParse({ q: "x".repeat(201) }).success).toBe(false);
  });
});

describe("articleListQuerySchema", () => {
  it("defaults to page 1, pageSize 12, sort newest", () => {
    const result = articleListQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(12);
    expect(result.sort).toBe("newest");
  });

  it("coerces string page/pageSize query params to numbers", () => {
    const result = articleListQuerySchema.parse({ page: "3", pageSize: "20" });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(20);
  });

  it("rejects a pageSize above 50", () => {
    expect(articleListQuerySchema.safeParse({ pageSize: "100" }).success).toBe(false);
  });

  it("rejects an invalid category", () => {
    expect(articleListQuerySchema.safeParse({ category: "SPORTS" }).success).toBe(false);
  });
});
