import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./format-relative-time";

describe("formatRelativeTime", () => {
  const now = new Date("2026-03-01T12:00:00Z");

  it("数秒前は「たった今」を返す", () => {
    expect(formatRelativeTime("2026-03-01T11:59:50Z", now)).toBe("たった今");
  });

  it("分単位の相対時間を返す", () => {
    expect(formatRelativeTime("2026-03-01T11:55:00Z", now)).toBe("5分前");
    expect(formatRelativeTime("2026-03-01T11:01:00Z", now)).toBe("59分前");
  });

  it("時間単位の相対時間を返す", () => {
    expect(formatRelativeTime("2026-03-01T10:00:00Z", now)).toBe("2時間前");
    expect(formatRelativeTime("2026-02-28T13:00:00Z", now)).toBe("23時間前");
  });

  it("日単位の相対時間を返す", () => {
    expect(formatRelativeTime("2026-02-28T12:00:00Z", now)).toBe("1日前");
    expect(formatRelativeTime("2026-02-25T12:00:00Z", now)).toBe("4日前");
    expect(formatRelativeTime("2026-02-01T12:00:00Z", now)).toBe("28日前");
  });

  it("月単位の相対時間を返す", () => {
    expect(formatRelativeTime("2026-01-01T12:00:00Z", now)).toBe("1ヶ月前");
    expect(formatRelativeTime("2025-09-01T12:00:00Z", now)).toBe("6ヶ月前");
  });

  it("年単位の相対時間を返す", () => {
    expect(formatRelativeTime("2025-01-01T12:00:00Z", now)).toBe("1年前");
    expect(formatRelativeTime("2023-01-01T12:00:00Z", now)).toBe("3年前");
  });

  it("1年未満（360〜364日前）は「0年前」ではなく「11ヶ月前」を返す", () => {
    // 360日は 30日 × 12 で月換算すると12ヶ月だが、365日未満なので年にはしない。
    expect(formatRelativeTime("2025-03-06T12:00:00Z", now)).toBe("11ヶ月前"); // 360日前
    expect(formatRelativeTime("2025-03-02T12:00:00Z", now)).toBe("11ヶ月前"); // 364日前
    expect(formatRelativeTime("2025-03-01T12:00:00Z", now)).toBe("1年前"); // 365日前
  });
});
