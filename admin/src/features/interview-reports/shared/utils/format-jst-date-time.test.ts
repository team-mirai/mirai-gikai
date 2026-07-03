import { describe, expect, it } from "vitest";
import { formatJstDateTime } from "./format-jst-date-time";

describe("formatJstDateTime", () => {
  it("UTCの日時を日本時間のYYYY/MM/DD HH:mm形式に整形する", () => {
    expect(formatJstDateTime("2026-05-12T07:30:00Z")).toBe("2026/05/12 16:30");
  });

  it("日付が日本時間で翌日に繰り上がるケースを処理する", () => {
    expect(formatJstDateTime("2026-01-31T23:00:00Z")).toBe("2026/02/01 08:00");
  });
});
