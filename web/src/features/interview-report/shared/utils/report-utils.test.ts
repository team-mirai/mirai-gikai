import { describe, expect, it } from "vitest";

import {
  calculateDuration,
  countCharacters,
  formatDateTime,
} from "./report-utils";

describe("formatDateTime", () => {
  it("returns '-' when dateString is null", () => {
    expect(formatDateTime(null)).toBe("-");
  });

  it("returns '-' when dateString is empty string", () => {
    expect(formatDateTime("")).toBe("-");
  });

  it("formats a UTC date string in JST", () => {
    // UTC 05:30 -> JST 14:30
    expect(formatDateTime("2025-01-15T05:30:00Z")).toBe("2025年1月15日  14:30");
  });

  it("pads hours and minutes with leading zeros", () => {
    // UTC 18:05 (前日) -> JST 03:05 (翌日)
    expect(formatDateTime("2025-03-04T18:05:00Z")).toBe("2025年3月5日  03:05");
  });

  it("handles midnight JST correctly", () => {
    // UTC 15:00 -> JST 00:00 (翌日)
    expect(formatDateTime("2025-12-30T15:00:00Z")).toBe(
      "2025年12月31日  00:00"
    );
  });
});

describe("calculateDuration", () => {
  it("returns '-' when completedAt is null", () => {
    expect(calculateDuration("2025-01-15T10:00:00Z", null)).toBe("-");
  });

  it("calculates duration in minutes", () => {
    expect(
      calculateDuration("2025-01-15T10:00:00Z", "2025-01-15T10:30:00Z")
    ).toBe("30 分");
  });

  it("rounds to nearest minute", () => {
    // 10 minutes and 29 seconds -> rounds to 10
    expect(
      calculateDuration("2025-01-15T10:00:00Z", "2025-01-15T10:10:29Z")
    ).toBe("10 分");

    // 10 minutes and 31 seconds -> rounds to 11
    expect(
      calculateDuration("2025-01-15T10:00:00Z", "2025-01-15T10:10:31Z")
    ).toBe("11 分");
  });

  it("returns 0 minutes when start and end are the same", () => {
    expect(
      calculateDuration("2025-01-15T10:00:00Z", "2025-01-15T10:00:00Z")
    ).toBe("0 分");
  });

  it("handles long durations", () => {
    expect(
      calculateDuration("2025-01-15T10:00:00Z", "2025-01-15T12:30:00Z")
    ).toBe("150 分");
  });
});

describe("countCharacters", () => {
  it("returns 0 for empty array", () => {
    expect(countCharacters([])).toBe(0);
  });

  it("counts only user messages", () => {
    const messages = [
      { content: "Hello", role: "user" },
      { content: "Hi there! How can I help?", role: "assistant" },
      { content: "Tell me more", role: "user" },
    ];
    // "Hello" (5) + "Tell me more" (12) = 17
    expect(countCharacters(messages)).toBe(17);
  });

  it("returns 0 when there are no user messages", () => {
    const messages = [
      { content: "Welcome!", role: "assistant" },
      { content: "System message", role: "system" },
    ];
    expect(countCharacters(messages)).toBe(0);
  });

  it("counts characters for all user messages", () => {
    const messages = [
      { content: "あいう", role: "user" },
      { content: "えお", role: "user" },
    ];
    // "あいう" (3) + "えお" (2) = 5
    expect(countCharacters(messages)).toBe(5);
  });

  it("handles empty content strings", () => {
    const messages = [
      { content: "", role: "user" },
      { content: "test", role: "user" },
    ];
    expect(countCharacters(messages)).toBe(4);
  });
});
