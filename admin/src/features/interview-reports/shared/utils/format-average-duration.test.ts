import { describe, expect, it } from "vitest";
import { formatDurationSeconds } from "./format-average-duration";

describe("formatDurationSeconds", () => {
  it("returns dash for null", () => {
    expect(formatDurationSeconds(null)).toBe("-");
  });

  it("returns dash for zero", () => {
    expect(formatDurationSeconds(0)).toBe("-");
  });

  it("returns dash for negative", () => {
    expect(formatDurationSeconds(-10)).toBe("-");
  });

  it("formats seconds only", () => {
    expect(formatDurationSeconds(45)).toBe("45秒");
  });

  it("formats minutes only", () => {
    expect(formatDurationSeconds(120)).toBe("2分");
  });

  it("formats minutes and seconds", () => {
    expect(formatDurationSeconds(150)).toBe("2分30秒");
  });

  it("rounds to nearest second", () => {
    expect(formatDurationSeconds(150.7)).toBe("2分31秒");
  });

  it("rounds tiny positive value to 1 second", () => {
    expect(formatDurationSeconds(0.3)).toBe("1秒");
  });
});
