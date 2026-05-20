import { describe, expect, it } from "vitest";
import {
  formatDurationSeconds,
  formatTotalDurationSeconds,
} from "./format-average-duration";

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

describe("formatTotalDurationSeconds", () => {
  it("returns dash for null", () => {
    expect(formatTotalDurationSeconds(null)).toBe("-");
  });

  it("returns dash for zero", () => {
    expect(formatTotalDurationSeconds(0)).toBe("-");
  });

  it("returns dash for negative", () => {
    expect(formatTotalDurationSeconds(-1)).toBe("-");
  });

  it("formats minutes only when under one hour", () => {
    expect(formatTotalDurationSeconds(45 * 60)).toBe("45分");
  });

  it("drops seconds (floor to minute)", () => {
    expect(formatTotalDurationSeconds(45 * 60 + 59)).toBe("45分");
  });

  it("formats hours only when no remaining minutes", () => {
    expect(formatTotalDurationSeconds(2 * 60 * 60)).toBe("2時間");
  });

  it("formats hours and minutes", () => {
    expect(formatTotalDurationSeconds(3 * 60 * 60 + 25 * 60)).toBe("3時間25分");
  });

  it("rounds large totals to floor minute", () => {
    expect(formatTotalDurationSeconds(36 * 60 * 60 + 7 * 60 + 30)).toBe(
      "36時間7分"
    );
  });

  it("returns 0分 for sub-minute total", () => {
    expect(formatTotalDurationSeconds(30)).toBe("0分");
  });
});
