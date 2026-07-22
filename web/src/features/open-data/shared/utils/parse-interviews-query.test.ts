import { describe, expect, it } from "vitest";
import { encodeCursor } from "./cursor";
import {
  DEFAULT_LIMIT,
  parseInterviewsQuery,
  toPositiveInt,
} from "./parse-interviews-query";

describe("parseInterviewsQuery", () => {
  it("未指定時はデフォルトlimit・cursorなしで解析する", () => {
    const result = parseInterviewsQuery(new URLSearchParams());
    expect(result).toEqual({ ok: true, limit: DEFAULT_LIMIT, cursor: null });
  });

  it("limit と cursor を解析する", () => {
    const cursor = {
      createdAt: "2026-07-14T12:00:00.000Z",
      id: "123e4567-e89b-42d3-a456-426614174000",
    };
    const params = new URLSearchParams({
      limit: "50",
      cursor: encodeCursor(cursor),
    });

    expect(parseInterviewsQuery(params)).toEqual({
      ok: true,
      limit: 50,
      cursor,
    });
  });

  it.each([
    "0",
    "101",
    "abc",
    "1.5",
  ])("不正な limit (%s) はエラーを返す", (limit) => {
    const result = parseInterviewsQuery(new URLSearchParams({ limit }));
    expect(result.ok).toBe(false);
  });

  it("不正な cursor はエラーを返す", () => {
    const result = parseInterviewsQuery(
      new URLSearchParams({ cursor: "invalid!!" })
    );
    expect(result.ok).toBe(false);
  });
});

describe("toPositiveInt", () => {
  it("正の整数文字列を解析する", () => {
    expect(toPositiveInt("30", 10)).toBe(30);
  });

  it.each([
    undefined,
    "0",
    "-1",
    "abc",
    "1.5",
  ])("不正な値 (%s) は fallback を返す", (value) => {
    expect(toPositiveInt(value, 10)).toBe(10);
  });
});
