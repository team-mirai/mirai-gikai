import { describe, expect, it } from "vitest";
import { validateOverview } from "./validate-overview";

describe("validateOverview", () => {
  it("accepts null and text up to 500 characters", () => {
    expect(validateOverview(null)).toBeNull();
    expect(validateOverview("説明文".repeat(166) + "説明")).toBeNull();
  });

  it("rejects text longer than 500 characters", () => {
    expect(validateOverview("あ".repeat(501))).toContain("500文字以内");
  });
});
