import { describe, expect, it } from "vitest";
import { validateDateRange } from "./validate-date-range";

describe("validateDateRange", () => {
  it("endDateがstartDateより後の場合、nullを返す", () => {
    expect(validateDateRange("2024-01-01", "2024-06-30")).toBeNull();
  });

  it("endDateがstartDateと同じ場合、nullを返す", () => {
    expect(validateDateRange("2024-01-01", "2024-01-01")).toBeNull();
  });

  it("endDateがstartDateより前の場合、エラーメッセージを返す", () => {
    expect(validateDateRange("2024-06-30", "2024-01-01")).toBe(
      "終了日は開始日以降の日付を指定してください"
    );
  });

  it("1日だけ前の場合でもエラーを返す", () => {
    expect(validateDateRange("2024-01-02", "2024-01-01")).toBe(
      "終了日は開始日以降の日付を指定してください"
    );
  });
});
