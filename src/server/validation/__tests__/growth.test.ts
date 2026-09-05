import { describe, it, expect } from "vitest";
import {
  addSkillSchema,
  updateSkillSchema,
  addLearningResourceSchema,
  updateLearningResourceSchema,
  logLearningSessionSchema,
} from "@/server/validation/growth";

describe("addSkillSchema", () => {
  it("applies default levels (0 current, 100 target) when omitted", () => {
    const result = addSkillSchema.parse({ name: "Rust" });
    expect(result.currentLevel).toBe(0);
    expect(result.targetLevel).toBe(100);
  });

  it("rejects a name shorter than 2 characters", () => {
    expect(addSkillSchema.safeParse({ name: "R" }).success).toBe(false);
  });

  it("rejects a targetLevel of 0 (a skill can't target 0% mastery)", () => {
    expect(addSkillSchema.safeParse({ name: "Rust", targetLevel: 0 }).success).toBe(false);
  });

  it("rejects a currentLevel above 100", () => {
    expect(addSkillSchema.safeParse({ name: "Rust", currentLevel: 150 }).success).toBe(false);
  });
});

describe("updateSkillSchema", () => {
  it("accepts an empty object (no-op update)", () => {
    expect(updateSkillSchema.safeParse({}).success).toBe(true);
  });

  it("rejects a note longer than 280 characters", () => {
    expect(updateSkillSchema.safeParse({ note: "x".repeat(281) }).success).toBe(false);
  });

  it("accepts a note at exactly the 280 character limit", () => {
    expect(updateSkillSchema.safeParse({ note: "x".repeat(280) }).success).toBe(true);
  });
});

describe("addLearningResourceSchema", () => {
  it("accepts a valid resource with all fields", () => {
    const result = addLearningResourceSchema.safeParse({
      title: "Designing Data-Intensive Applications",
      type: "BOOK",
      category: "Systems",
      url: "https://example.com/ddia",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid resource type", () => {
    expect(addLearningResourceSchema.safeParse({ title: "Some Podcast", type: "PODCAST" }).success).toBe(false);
  });

  it("rejects a malformed URL but allows an empty string", () => {
    expect(addLearningResourceSchema.safeParse({ title: "Valid Title", type: "BOOK", url: "not-a-url" }).success).toBe(false);
    expect(addLearningResourceSchema.safeParse({ title: "Valid Title", type: "BOOK", url: "" }).success).toBe(true);
  });
});

describe("updateLearningResourceSchema", () => {
  it("rejects a rating outside 1-5", () => {
    expect(updateLearningResourceSchema.safeParse({ rating: 0 }).success).toBe(false);
    expect(updateLearningResourceSchema.safeParse({ rating: 6 }).success).toBe(false);
  });

  it("accepts a rating of exactly 1 or 5", () => {
    expect(updateLearningResourceSchema.safeParse({ rating: 1 }).success).toBe(true);
    expect(updateLearningResourceSchema.safeParse({ rating: 5 }).success).toBe(true);
  });
});

describe("logLearningSessionSchema", () => {
  it("requires a positive duration", () => {
    expect(logLearningSessionSchema.safeParse({ durationMinutes: 0 }).success).toBe(false);
    expect(logLearningSessionSchema.safeParse({ durationMinutes: -10 }).success).toBe(false);
  });

  it("rejects a duration longer than 600 minutes (10 hours) as almost certainly a data-entry error", () => {
    expect(logLearningSessionSchema.safeParse({ durationMinutes: 601 }).success).toBe(false);
  });

  it("accepts a minimal valid session with just a duration", () => {
    expect(logLearningSessionSchema.safeParse({ durationMinutes: 30 }).success).toBe(true);
  });

  it("rejects a resourceId that isn't a valid cuid", () => {
    expect(logLearningSessionSchema.safeParse({ durationMinutes: 30, resourceId: "not-a-cuid" }).success).toBe(false);
  });
});
