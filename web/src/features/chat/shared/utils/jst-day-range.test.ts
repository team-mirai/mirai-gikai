import { describe, it, expect, vi, afterEach } from "vitest";
import { getJstDayRange, getJstMonthRange } from "./jst-day-range";

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

describe("getJstMonthRange", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("月初の場合、当月1日〜翌月1日の範囲を返す", () => {
    // 2026-03-01 10:00 JST = 2026-03-01 01:00 UTC
    vi.setSystemTime(new Date("2026-03-01T01:00:00.000Z"));

    const range = getJstMonthRange();

    // JST 2026-03-01 00:00 = UTC 2026-02-28 15:00
    expect(range.from).toBe("2026-02-28T15:00:00.000Z");
    // JST 2026-04-01 00:00 = UTC 2026-03-31 15:00
    expect(range.to).toBe("2026-03-31T15:00:00.000Z");
  });

  it("月末の場合、当月1日〜翌月1日の範囲を返す", () => {
    // 2026-03-31 23:00 JST = 2026-03-31 14:00 UTC
    vi.setSystemTime(new Date("2026-03-31T14:00:00.000Z"));

    const range = getJstMonthRange();

    // JST 2026-03-01 00:00 = UTC 2026-02-28 15:00
    expect(range.from).toBe("2026-02-28T15:00:00.000Z");
    // JST 2026-04-01 00:00 = UTC 2026-03-31 15:00
    expect(range.to).toBe("2026-03-31T15:00:00.000Z");
  });

  it("12月の場合、翌年1月までの範囲を返す", () => {
    // 2026-12-15 12:00 JST = 2026-12-15 03:00 UTC
    vi.setSystemTime(new Date("2026-12-15T03:00:00.000Z"));

    const range = getJstMonthRange();

    // JST 2026-12-01 00:00 = UTC 2026-11-30 15:00
    expect(range.from).toBe("2026-11-30T15:00:00.000Z");
    // JST 2027-01-01 00:00 = UTC 2026-12-31 15:00
    expect(range.to).toBe("2026-12-31T15:00:00.000Z");
  });

  it("JST午前中（UTC前日）で月またぎの場合、正しい月の範囲を返す", () => {
    // 2026-04-01 02:00 JST = 2026-03-31 17:00 UTC
    // JSTでは4月なので4月の範囲を返すべき
    vi.setSystemTime(new Date("2026-03-31T17:00:00.000Z"));

    const range = getJstMonthRange();

    // JST 2026-04-01 00:00 = UTC 2026-03-31 15:00
    expect(range.from).toBe("2026-03-31T15:00:00.000Z");
    // JST 2026-05-01 00:00 = UTC 2026-04-30 15:00
    expect(range.to).toBe("2026-04-30T15:00:00.000Z");
  });

  it("fromとtoの差が当月の日数分である", () => {
    // 2026年3月（31日間）
    vi.setSystemTime(new Date("2026-03-15T00:00:00.000Z"));

    const range = getJstMonthRange();
    const from = new Date(range.from).getTime();
    const to = new Date(range.to).getTime();

    expect(to - from).toBe(31 * 24 * 60 * 60 * 1000);
  });
});
