import { describe, expect, it, vi } from "vitest";

import { formatDate, formatDateWithDots, getJapanTime } from "./date";

describe("formatDate", () => {
  it("formats a date string in Japanese locale", () => {
    expect(formatDate("2025-01-15")).toBe("2025年1月15日");
  });

  it("formats a date with double-digit month and day", () => {
    expect(formatDate("2025-12-31")).toBe("2025年12月31日");
  });

  it("formats an ISO datetime string", () => {
    expect(formatDate("2025-03-05T10:00:00Z")).toBe("2025年3月5日");
  });
});

describe("formatDateWithDots", () => {
  it("formats a date with dot separator without zero-padding", () => {
    expect(formatDateWithDots("2025-10-01")).toBe("2025.10.1");
  });

  it("formats single-digit month and day without padding", () => {
    expect(formatDateWithDots("2025-01-05")).toBe("2025.1.5");
  });

  it("formats double-digit month and day", () => {
    expect(formatDateWithDots("2025-12-31")).toBe("2025.12.31");
  });
});

describe("getJapanTime", () => {
  it("returns a Date object", () => {
    const result = getJapanTime();
    expect(result).toBeInstanceOf(Date);
  });

  it("returns a date based on Asia/Tokyo timezone", () => {
    const fakeDate = new Date("2025-01-15T00:00:00Z");
    vi.setSystemTime(fakeDate);

    const result = getJapanTime();
    // UTC 00:00 = JST 09:00
    expect(result.getHours()).toBe(9);

    vi.useRealTimers();
  });
});
