import { describe, expect, it } from "vitest";
import { buildKnowledgeSourceSection } from "./knowledge-source-section";

describe("buildKnowledgeSourceSection", () => {
  it("空文字列なら空文字列を返す", () => {
    expect(buildKnowledgeSourceSection("")).toBe("");
  });

  it("空白のみの場合は空文字列を返す", () => {
    expect(buildKnowledgeSourceSection("   \n\n  ")).toBe("");
  });

  it("非空の値なら<knowledge_source>タグで囲って返す", () => {
    const result = buildKnowledgeSourceSection("テスト知識");

    expect(result).toContain("補足ナレッジ");
    expect(result).toContain("<knowledge_source>");
    expect(result).toContain("テスト知識");
    expect(result).toContain("</knowledge_source>");
  });

  it("前後の空白はトリムされる", () => {
    const result = buildKnowledgeSourceSection("  内容  \n\n");

    expect(result).toContain("<knowledge_source>\n内容\n</knowledge_source>");
  });
});
