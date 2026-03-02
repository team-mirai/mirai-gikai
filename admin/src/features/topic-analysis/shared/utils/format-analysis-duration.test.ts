import { describe, expect, it } from "vitest";
import {
  formatAnalysisDuration,
  formatDurationMs,
} from "./format-analysis-duration";

describe("formatDurationMs", () => {
  it("returns seconds only when less than 60s", () => {
    expect(formatDurationMs(5000)).toBe("5秒");
    expect(formatDurationMs(0)).toBe("0秒");
    expect(formatDurationMs(59999)).toBe("59秒");
  });

  it("returns minutes and seconds when 60s or more", () => {
    expect(formatDurationMs(60000)).toBe("1分0秒");
    expect(formatDurationMs(90000)).toBe("1分30秒");
    expect(formatDurationMs(125000)).toBe("2分5秒");
  });

  it("returns '-' for negative values", () => {
    expect(formatDurationMs(-1000)).toBe("-");
  });
});

describe("formatAnalysisDuration", () => {
  it("formats duration between two timestamps", () => {
    const started = "2026-03-01T10:00:00Z";
    const completed = "2026-03-01T10:01:30Z";
    expect(formatAnalysisDuration(started, completed)).toBe("1分30秒");
  });

  it("returns '-' when startedAt is null", () => {
    expect(formatAnalysisDuration(null, "2026-03-01T10:01:30Z")).toBe("-");
  });

  it("returns '-' when completedAt is null", () => {
    expect(formatAnalysisDuration("2026-03-01T10:00:00Z", null)).toBe("-");
  });

  it("returns '-' when both are null", () => {
    expect(formatAnalysisDuration(null, null)).toBe("-");
  });

  it("returns '0秒' when timestamps are the same", () => {
    const ts = "2026-03-01T10:00:00Z";
    expect(formatAnalysisDuration(ts, ts)).toBe("0秒");
  });
});
