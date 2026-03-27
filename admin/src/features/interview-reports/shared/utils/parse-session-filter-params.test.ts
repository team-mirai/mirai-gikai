import { describe, expect, it } from "vitest";
import { parseSessionFilterParams } from "./parse-session-filter-params";

describe("parseSessionFilterParams", () => {
  it("デフォルト値を返す（パラメータなし）", () => {
    const result = parseSessionFilterParams();
    expect(result).toEqual({
      status: "completed",
      visibility: "all",
      stance: "all",
      role: "all",
      moderation: "all",
    });
  });

  it("有効な値を受け付ける", () => {
    const result = parseSessionFilterParams(
      "in_progress",
      "public",
      "for",
      "subject_expert",
      "warning"
    );
    expect(result).toEqual({
      status: "in_progress",
      visibility: "public",
      stance: "for",
      role: "subject_expert",
      moderation: "warning",
    });
  });

  it("allを受け付ける", () => {
    const result = parseSessionFilterParams("all", "all", "all", "all", "all");
    expect(result).toEqual({
      status: "all",
      visibility: "all",
      stance: "all",
      role: "all",
      moderation: "all",
    });
  });

  it("無効な値はデフォルトにフォールバックする", () => {
    const result = parseSessionFilterParams(
      "invalid",
      "invalid",
      "invalid",
      "invalid",
      "invalid"
    );
    expect(result).toEqual({
      status: "completed",
      visibility: "all",
      stance: "all",
      role: "all",
      moderation: "all",
    });
  });

  it("archivedステータスを受け付ける", () => {
    const result = parseSessionFilterParams("archived");
    expect(result).toEqual({
      status: "archived",
      visibility: "all",
      stance: "all",
      role: "all",
      moderation: "all",
    });
  });

  it("一部のみ指定した場合、残りはデフォルト", () => {
    const result = parseSessionFilterParams("all", undefined, "against");
    expect(result).toEqual({
      status: "all",
      visibility: "all",
      stance: "against",
      role: "all",
      moderation: "all",
    });
  });

  it("モデレーションフィルタの各値を受け付ける", () => {
    for (const value of ["ok", "warning", "ng", "unscored"]) {
      const result = parseSessionFilterParams(
        undefined,
        undefined,
        undefined,
        undefined,
        value
      );
      expect(result.moderation).toBe(value);
    }
  });
});
