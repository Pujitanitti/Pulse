import { describe, it, expect } from "vitest";
import { createGoalSchema, updateGoalSchema, listGoalsQuerySchema, createMilestoneSchema } from "@/server/validation/goals";

describe("createGoalSchema", () => {
  it("accepts a minimal valid goal and applies defaults", () => {
    const result = createGoalSchema.safeParse({ title: "Ship v1" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.priority).toBe("MEDIUM");
  });

  it("rejects a title shorter than 2 characters", () => {
    expect(createGoalSchema.safeParse({ title: "A" }).success).toBe(false);
  });

  it("rejects an invalid priority value", () => {
    expect(createGoalSchema.safeParse({ title: "Ship v1", priority: "URGENT" }).success).toBe(false);
  });

  it("rejects a deadline that isn't a valid ISO datetime string", () => {
    expect(createGoalSchema.safeParse({ title: "Ship v1", deadline: "next tuesday" }).success).toBe(false);
  });

  it("accepts up to 20 initial milestones but rejects 21", () => {
    const ok = createGoalSchema.safeParse({ title: "Ship v1", milestones: Array(20).fill("Step") });
    const tooMany = createGoalSchema.safeParse({ title: "Ship v1", milestones: Array(21).fill("Step") });
    expect(ok.success).toBe(true);
    expect(tooMany.success).toBe(false);
  });
});

describe("updateGoalSchema", () => {
  it("accepts a partial update with just a status change", () => {
    expect(updateGoalSchema.safeParse({ status: "COMPLETED" }).success).toBe(true);
  });

  it("accepts an explicit null to clear the description", () => {
    expect(updateGoalSchema.safeParse({ description: null }).success).toBe(true);
  });

  it("rejects progress outside 0-100", () => {
    expect(updateGoalSchema.safeParse({ progress: 150 }).success).toBe(false);
    expect(updateGoalSchema.safeParse({ progress: -5 }).success).toBe(false);
  });

  it("accepts the archived boolean flag", () => {
    expect(updateGoalSchema.safeParse({ archived: true }).success).toBe(true);
  });
});

describe("listGoalsQuerySchema", () => {
  it("defaults archived to false and sort to deadline when omitted", () => {
    const result = listGoalsQuerySchema.parse({});
    expect(result.archived).toBe(false);
    expect(result.sort).toBe("deadline");
  });

  it("coerces the archived query-string value 'true' to a boolean", () => {
    expect(listGoalsQuerySchema.parse({ archived: "true" }).archived).toBe(true);
  });

  it("rejects an unknown sort value", () => {
    expect(listGoalsQuerySchema.safeParse({ sort: "alphabetical" }).success).toBe(false);
  });
});

describe("createMilestoneSchema", () => {
  it("rejects an empty title", () => {
    expect(createMilestoneSchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("accepts a normal title", () => {
    expect(createMilestoneSchema.safeParse({ title: "Design the schema" }).success).toBe(true);
  });
});
