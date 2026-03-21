import { describe, expect, it } from "vitest";
import { formatAverageDuration } from "./format-average-duration";

describe("formatAverageDuration", () => {
  it("returns dash for null", () => {
    expect(formatAverageDuration(null)).toBe("-");
  });

  it("returns dash for zero", () => {
    expect(formatAverageDuration(0)).toBe("-");
  });

  it("returns dash for negative", () => {
    expect(formatAverageDuration(-10)).toBe("-");
  });

  it("formats seconds only", () => {
    expect(formatAverageDuration(45)).toBe("45秒");
  });

  it("formats minutes only", () => {
    expect(formatAverageDuration(120)).toBe("2分");
  });

  it("formats minutes and seconds", () => {
    expect(formatAverageDuration(150)).toBe("2分30秒");
  });

  it("rounds to nearest second", () => {
    expect(formatAverageDuration(150.7)).toBe("2分31秒");
  });

  it("rounds tiny positive value to 1 second", () => {
    expect(formatAverageDuration(0.3)).toBe("1秒");
  });
});
