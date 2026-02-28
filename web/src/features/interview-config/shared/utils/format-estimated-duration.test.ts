import { describe, expect, it } from "vitest";
import { formatEstimatedDuration } from "./format-estimated-duration";

describe("formatEstimatedDuration", () => {
  it("nullの場合はnullを返す", () => {
    expect(formatEstimatedDuration(null)).toBeNull();
  });

  it("5分の場合は「約5分〜」を返す", () => {
    expect(formatEstimatedDuration(5)).toBe("約5分〜");
  });

  it("10分の場合は「約10分〜」を返す", () => {
    expect(formatEstimatedDuration(10)).toBe("約10分〜");
  });

  it("15分の場合は「約15分〜」を返す", () => {
    expect(formatEstimatedDuration(15)).toBe("約15分〜");
  });
});
