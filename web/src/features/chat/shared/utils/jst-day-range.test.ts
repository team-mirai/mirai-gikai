import { describe, it, expect, vi, afterEach } from "vitest";
import { getJstDayRange } from "./jst-day-range";

describe("getJstDayRange", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("JST午前中（UTC前日）の場合、正しいJST日の範囲を返す", () => {
    // 2026-03-20 02:00 JST = 2026-03-19 17:00 UTC
    vi.setSystemTime(new Date("2026-03-19T17:00:00.000Z"));

    const range = getJstDayRange();

    // JST 2026-03-20 00:00 = UTC 2026-03-19 15:00
    expect(range.from).toBe("2026-03-19T15:00:00.000Z");
    // JST 2026-03-21 00:00 = UTC 2026-03-20 15:00
    expect(range.to).toBe("2026-03-20T15:00:00.000Z");
  });

  it("JST午後（UTCと同日）の場合、正しいJST日の範囲を返す", () => {
    // 2026-03-20 15:00 JST = 2026-03-20 06:00 UTC
    vi.setSystemTime(new Date("2026-03-20T06:00:00.000Z"));

    const range = getJstDayRange();

    // JST 2026-03-20 00:00 = UTC 2026-03-19 15:00
    expect(range.from).toBe("2026-03-19T15:00:00.000Z");
    expect(range.to).toBe("2026-03-20T15:00:00.000Z");
  });

  it("fromとtoの差が24時間である", () => {
    const range = getJstDayRange();
    const from = new Date(range.from).getTime();
    const to = new Date(range.to).getTime();

    expect(to - from).toBe(24 * 60 * 60 * 1000);
  });
});
