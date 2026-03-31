import { describe, expect, it } from "vitest";
import { parseSessionSortParams } from "./parse-session-sort-params";

describe("parseSessionSortParams", () => {
  it("デフォルト値を返す（パラメータなし）", () => {
    const result = parseSessionSortParams();
    expect(result).toEqual({ field: "started_at", order: "desc" });
  });

  it("有効なフィールドとオーダーを受け付ける", () => {
    expect(parseSessionSortParams("started_at", "asc")).toEqual({
      field: "started_at",
      order: "asc",
    });
    expect(parseSessionSortParams("message_count", "desc")).toEqual({
      field: "message_count",
      order: "desc",
    });
    expect(parseSessionSortParams("helpful_count", "desc")).toEqual({
      field: "helpful_count",
      order: "desc",
    });
    expect(parseSessionSortParams("moderation_score", "asc")).toEqual({
      field: "moderation_score",
      order: "asc",
    });
  });

  it("無効なフィールドはデフォルトにフォールバックする", () => {
    const result = parseSessionSortParams("invalid_column", "asc");
    expect(result).toEqual({ field: "started_at", order: "asc" });
  });

  it("無効なオーダーはデフォルトにフォールバックする", () => {
    const result = parseSessionSortParams("started_at", "invalid");
    expect(result).toEqual({ field: "started_at", order: "desc" });
  });

  it("両方無効な場合は完全にデフォルトにフォールバックする", () => {
    const result = parseSessionSortParams("bad", "bad");
    expect(result).toEqual({ field: "started_at", order: "desc" });
  });
});
