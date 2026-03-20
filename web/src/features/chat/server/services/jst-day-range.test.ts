import { describe, it, expect, vi, afterEach } from "vitest";
import { getJstDayRange } from "./jst-day-range";

describe("getJstDayRange", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("JST午前0時ちょうどの場合、当日の範囲を返す", () => {
    // JST 2026-03-20 00:00:00 = UTC 2026-03-19 15:00:00
    vi.setSystemTime(new Date("2026-03-19T15:00:00.000Z"));

    const range = getJstDayRange();

    expect(range.from).toBe("2026-03-19T15:00:00.000Z");
    expect(range.to).toBe("2026-03-20T15:00:00.000Z");
  });

  it("JST午後の場合、当日の範囲を返す", () => {
    // JST 2026-03-20 14:30:00 = UTC 2026-03-20 05:30:00
    vi.setSystemTime(new Date("2026-03-20T05:30:00.000Z"));

    const range = getJstDayRange();

    expect(range.from).toBe("2026-03-19T15:00:00.000Z");
    expect(range.to).toBe("2026-03-20T15:00:00.000Z");
  });

  it("UTC深夜（JST午前）の場合、正しいJST日の範囲を返す", () => {
    // JST 2026-03-20 02:00:00 = UTC 2026-03-19 17:00:00
    vi.setSystemTime(new Date("2026-03-19T17:00:00.000Z"));

    const range = getJstDayRange();

    expect(range.from).toBe("2026-03-19T15:00:00.000Z");
    expect(range.to).toBe("2026-03-20T15:00:00.000Z");
  });

  it("from と to の差が24時間である", () => {
    vi.setSystemTime(new Date("2026-03-20T12:00:00.000Z"));

    const range = getJstDayRange();
    const diff = new Date(range.to).getTime() - new Date(range.from).getTime();

    expect(diff).toBe(24 * 60 * 60 * 1000);
  });
});
