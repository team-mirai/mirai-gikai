import { describe, expect, it } from "vitest";
import { formatOpinionDate } from "./format-opinion-date";

const now = new Date("2026-06-11T12:00:00.000Z");

describe("formatOpinionDate", () => {
  it("null・不正な値は空文字", () => {
    expect(formatOpinionDate(null, now)).toBe("");
    expect(formatOpinionDate("not-a-date", now)).toBe("");
  });

  it("1分未満はたった今", () => {
    expect(formatOpinionDate("2026-06-11T11:59:30.000Z", now)).toBe("たった今");
  });

  it("分・時間・日・週で相対表記する", () => {
    expect(formatOpinionDate("2026-06-11T11:30:00.000Z", now)).toBe("30分前");
    expect(formatOpinionDate("2026-06-11T10:00:00.000Z", now)).toBe("2時間前");
    expect(formatOpinionDate("2026-06-08T12:00:00.000Z", now)).toBe("3日前");
    expect(formatOpinionDate("2026-06-01T12:00:00.000Z", now)).toBe("1週間前");
  });

  it("30日以上前は YYYY.M.D の絶対表記", () => {
    expect(formatOpinionDate("2025-12-06T00:00:00.000Z", now)).toBe(
      "2025.12.6"
    );
    expect(formatOpinionDate("2025-01-06T00:00:00.000Z", now)).toBe("2025.1.6");
  });
});
