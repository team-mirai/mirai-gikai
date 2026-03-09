import { describe, expect, it } from "vitest";
import { parseBillSortParams } from "./parse-bill-sort-params";

describe("parseBillSortParams", () => {
  it("パラメータなしの場合はデフォルト値を返す", () => {
    const result = parseBillSortParams();
    expect(result).toEqual({ field: "created_at", order: "desc" });
  });

  it("有効なフィールドとオーダーを返す", () => {
    const result = parseBillSortParams("status_order", "asc");
    expect(result).toEqual({ field: "status_order", order: "asc" });
  });

  it("publish_status_orderフィールドを受け付ける", () => {
    const result = parseBillSortParams("publish_status_order", "desc");
    expect(result).toEqual({ field: "publish_status_order", order: "desc" });
  });

  it("published_atフィールドを受け付ける", () => {
    const result = parseBillSortParams("published_at", "asc");
    expect(result).toEqual({ field: "published_at", order: "asc" });
  });

  it("不正なフィールドはデフォルトフィールドにフォールバックする", () => {
    const result = parseBillSortParams("invalid_field", "asc");
    expect(result).toEqual({ field: "created_at", order: "asc" });
  });

  it("不正なオーダーはデフォルトオーダーにフォールバックする", () => {
    const result = parseBillSortParams("status_order", "invalid");
    expect(result).toEqual({ field: "status_order", order: "desc" });
  });

  it("両方不正な場合は完全にデフォルトにフォールバックする", () => {
    const result = parseBillSortParams("bad", "bad");
    expect(result).toEqual({ field: "created_at", order: "desc" });
  });

  it("undefinedパラメータはデフォルトにフォールバックする", () => {
    const result = parseBillSortParams(undefined, undefined);
    expect(result).toEqual({ field: "created_at", order: "desc" });
  });
});
