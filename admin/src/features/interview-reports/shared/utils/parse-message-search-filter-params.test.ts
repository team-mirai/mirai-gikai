import { describe, expect, it } from "vitest";
import {
  appendMessageSearchFilterParams,
  hasReportLevelSearchFilters,
  parseMessageSearchFilterParams,
} from "./parse-message-search-filter-params";

describe("parseMessageSearchFilterParams", () => {
  it("有効な値をそのまま返す", () => {
    expect(
      parseMessageSearchFilterParams("for", "subject_expert", "医師")
    ).toEqual({
      stance: "for",
      role: "subject_expert",
      roleTitle: "医師",
    });
  });

  it("条件付きスタンスも有効な値として受け付ける", () => {
    expect(parseMessageSearchFilterParams("conditional_for").stance).toBe(
      "conditional_for"
    );
    expect(
      parseMessageSearchFilterParams("continued_deliberation").stance
    ).toBe("continued_deliberation");
  });

  it("不正な値はデフォルトにフォールバックする", () => {
    expect(parseMessageSearchFilterParams("invalid", "invalid")).toEqual({
      stance: "all",
      role: "all",
      roleTitle: "",
    });
  });

  it("未指定はデフォルトを返す", () => {
    expect(parseMessageSearchFilterParams()).toEqual({
      stance: "all",
      role: "all",
      roleTitle: "",
    });
  });

  it("roleTitleは前後の空白を除去する", () => {
    expect(
      parseMessageSearchFilterParams(undefined, undefined, "  医師  ")
    ).toEqual({
      stance: "all",
      role: "all",
      roleTitle: "医師",
    });
  });
});

describe("hasReportLevelSearchFilters", () => {
  it("すべてデフォルトならfalse", () => {
    expect(
      hasReportLevelSearchFilters({ stance: "all", role: "all", roleTitle: "" })
    ).toBe(false);
  });

  it("いずれかが指定されていればtrue", () => {
    expect(
      hasReportLevelSearchFilters({ stance: "for", role: "all", roleTitle: "" })
    ).toBe(true);
    expect(
      hasReportLevelSearchFilters({
        stance: "all",
        role: "general_citizen",
        roleTitle: "",
      })
    ).toBe(true);
    expect(
      hasReportLevelSearchFilters({
        stance: "all",
        role: "all",
        roleTitle: "医師",
      })
    ).toBe(true);
  });
});

describe("appendMessageSearchFilterParams", () => {
  it("デフォルト以外の値のみパラメータに書き出す", () => {
    const params = new URLSearchParams();
    appendMessageSearchFilterParams(params, {
      stance: "conditional_for",
      role: "all",
      roleTitle: "医師",
    });
    expect(params.get("stance")).toBe("conditional_for");
    expect(params.has("role")).toBe(false);
    expect(params.get("roleTitle")).toBe("医師");
  });

  it("デフォルト値に戻した場合は既存のパラメータを削除する", () => {
    const params = new URLSearchParams("stance=for&role=general_citizen");
    appendMessageSearchFilterParams(params, {
      stance: "all",
      role: "all",
      roleTitle: "",
    });
    expect(params.toString()).toBe("");
  });

  it("parseMessageSearchFilterParamsと往復して一致する", () => {
    const filters = {
      stance: "against",
      role: "work_related",
      roleTitle: "教員",
    } as const;
    const params = new URLSearchParams();
    appendMessageSearchFilterParams(params, filters);
    expect(
      parseMessageSearchFilterParams(
        params.get("stance") ?? undefined,
        params.get("role") ?? undefined,
        params.get("roleTitle") ?? undefined
      )
    ).toEqual(filters);
  });
});
