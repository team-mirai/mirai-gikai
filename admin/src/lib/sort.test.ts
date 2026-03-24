import { describe, expect, it } from "vitest";
import { parseSortParams } from "./sort";

const VALID_FIELDS = ["name", "created_at", "score"] as const;
type TestField = (typeof VALID_FIELDS)[number];
const DEFAULT = { field: "created_at" as TestField, order: "desc" as const };

describe("parseSortParams", () => {
  it("デフォルト値を返す（パラメータなし）", () => {
    const result = parseSortParams(VALID_FIELDS, DEFAULT);
    expect(result).toEqual({ field: "created_at", order: "desc" });
  });

  it("有効なフィールドとオーダーを受け付ける", () => {
    const result = parseSortParams(VALID_FIELDS, DEFAULT, "name", "asc");
    expect(result).toEqual({ field: "name", order: "asc" });
  });

  it("無効なフィールドはデフォルトにフォールバックする", () => {
    const result = parseSortParams(VALID_FIELDS, DEFAULT, "invalid", "asc");
    expect(result).toEqual({ field: "created_at", order: "asc" });
  });

  it("無効なオーダーはデフォルトにフォールバックする", () => {
    const result = parseSortParams(VALID_FIELDS, DEFAULT, "score", "bad");
    expect(result).toEqual({ field: "score", order: "desc" });
  });

  it("両方無効な場合は完全にデフォルトにフォールバックする", () => {
    const result = parseSortParams(VALID_FIELDS, DEFAULT, "bad", "bad");
    expect(result).toEqual({ field: "created_at", order: "desc" });
  });
});
