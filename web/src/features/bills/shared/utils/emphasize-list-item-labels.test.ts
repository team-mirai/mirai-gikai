import { describe, expect, it } from "vitest";
import { emphasizeListItemLabels } from "./emphasize-list-item-labels";

describe("emphasizeListItemLabels", () => {
  it("「- 小見出し：本文」を太字の小見出しと本文の2行に分ける", () => {
    expect(
      emphasizeListItemLabels("- 利益相反防止の法定化：省令で義務付けます")
    ).toBe("- **利益相反防止の法定化**\n  省令で義務付けます");
  });

  it("番号付きリストも同様に変換する", () => {
    expect(emphasizeListItemLabels("1. 見出し：本文")).toBe(
      "1. **見出し**\n   本文"
    );
  });

  it("入れ子の箇条はインデントを保って変換する", () => {
    expect(emphasizeListItemLabels("  - 見出し：本文")).toBe(
      "  - **見出し**\n    本文"
    );
  });

  it("小見出しのない箇条や通常の段落はそのまま返す", () => {
    const markdown = "- 小見出しのない箇条\n本文：コロンを含む段落";
    expect(emphasizeListItemLabels(markdown)).toBe(markdown);
  });

  it("コロンまでが長すぎる箇条は小見出しとみなさない", () => {
    const line = `- ${"あ".repeat(31)}：本文`;
    expect(emphasizeListItemLabels(line)).toBe(line);
  });

  it("既に太字を含む小見出しは変換しない", () => {
    const line = "- **見出し**：本文";
    expect(emphasizeListItemLabels(line)).toBe(line);
  });
});
