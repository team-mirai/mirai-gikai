import { describe, expect, it } from "vitest";
import {
  formatAnsweredAt,
  formatRoleDescriptionLines,
  parseOpinions,
} from "./format-utils";

describe("formatAnsweredAt", () => {
  it("null・不正な値は空文字", () => {
    expect(formatAnsweredAt(null)).toBe("");
    expect(formatAnsweredAt("not-a-date")).toBe("");
  });

  it("YYYY.M.D HH:mm 形式（日本時間）で整形する", () => {
    // 2026-06-30T01:05:00Z = 2026-06-30T10:05:00+09:00
    expect(formatAnsweredAt("2026-06-30T01:05:00.000Z")).toBe(
      "2026.6.30 10:05"
    );
  });

  it("実行環境のタイムゾーンによらずJSTの暦日・時刻で整形する", () => {
    // 2026-06-29T15:30:00Z = 2026-06-30T00:30:00+09:00（UTC暦日では前日）
    expect(formatAnsweredAt("2026-06-29T15:30:00.000Z")).toBe(
      "2026.6.30 00:30"
    );
  });
});

describe("formatRoleDescriptionLines", () => {
  it("splits by newlines, trims, and adds bullet prefix", () => {
    expect(formatRoleDescriptionLines("A\nB\nC")).toEqual([
      "・A",
      "・B",
      "・C",
    ]);
  });

  it("preserves existing bullet prefix for multiple lines", () => {
    expect(formatRoleDescriptionLines("・First\n・Second")).toEqual([
      "・First",
      "・Second",
    ]);
  });

  it("filters out empty lines", () => {
    expect(formatRoleDescriptionLines("A\n\n\nB")).toEqual(["・A", "・B"]);
  });

  it("trims whitespace from each line", () => {
    expect(formatRoleDescriptionLines("  A  \n  B  ")).toEqual(["・A", "・B"]);
  });

  it("returns single line without bullet prefix", () => {
    expect(formatRoleDescriptionLines("Single line")).toEqual(["Single line"]);
  });

  it("returns single line with existing bullet as-is", () => {
    expect(formatRoleDescriptionLines("・Already bullet")).toEqual([
      "・Already bullet",
    ]);
  });

  it("handles mixed bullet and non-bullet lines", () => {
    expect(formatRoleDescriptionLines("・First\nSecond\n・Third")).toEqual([
      "・First",
      "・Second",
      "・Third",
    ]);
  });

  it("filters whitespace-only lines", () => {
    expect(formatRoleDescriptionLines("A\n   \nB")).toEqual(["・A", "・B"]);
  });
});

describe("parseOpinions", () => {
  it("returns empty array for null", () => {
    expect(parseOpinions(null)).toEqual([]);
  });

  it("returns empty array for undefined", () => {
    expect(parseOpinions(undefined)).toEqual([]);
  });

  it("returns empty array for a string", () => {
    expect(parseOpinions("not an array")).toEqual([]);
  });

  it("returns empty array for a number", () => {
    expect(parseOpinions(42)).toEqual([]);
  });

  it("returns empty array for an object", () => {
    expect(parseOpinions({ title: "test" })).toEqual([]);
  });

  it("returns the array as-is when it is an array", () => {
    const opinions = [
      { title: "Title 1", content: "Content 1" },
      { title: "Title 2", content: "Content 2" },
    ];
    expect(parseOpinions(opinions)).toEqual(opinions);
  });

  it("returns empty array for an empty array", () => {
    expect(parseOpinions([])).toEqual([]);
  });

  it("preserves source_message_id when present", () => {
    const opinions = [
      { title: "Title", content: "Content", source_message_id: "msg-123" },
      { title: "Title 2", content: "Content 2", source_message_id: null },
    ];
    expect(parseOpinions(opinions)).toEqual(opinions);
  });
});
