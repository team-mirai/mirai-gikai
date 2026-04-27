import { describe, expect, it } from "vitest";
import { buildBillChatSystemHardPrompt } from "./bill-chat-system-hard";

describe("buildBillChatSystemHardPrompt", () => {
  it("4つの議案パラメータがプロンプトに埋め込まれる", () => {
    const result = buildBillChatSystemHardPrompt(
      "テスト法案名",
      "テスト法案タイトル",
      "テスト法案要約",
      "テスト法案詳細",
      ""
    );

    expect(result).toContain("テスト法案名");
    expect(result).toContain("テスト法案タイトル");
    expect(result).toContain("テスト法案要約");
    expect(result).toContain("テスト法案詳細");
  });

  it("難易度「難しい」セクションが含まれる", () => {
    const result = buildBillChatSystemHardPrompt("a", "b", "c", "d", "");

    expect(result).toContain("回答の難易度：難しい");
    expect(result).toContain("専門用語を正確に使用");
  });

  it("みらい議会の説明が含まれる", () => {
    const result = buildBillChatSystemHardPrompt("a", "b", "c", "d", "");

    expect(result).toContain("みらい議会");
    expect(result).toContain("チームみらい");
  });

  it("knowledgeSourceが空のとき補足ナレッジセクションは含まれない", () => {
    const result = buildBillChatSystemHardPrompt("a", "b", "c", "d", "");

    expect(result).not.toContain("補足ナレッジ");
    expect(result).not.toContain("<knowledge_source>");
  });

  it("knowledgeSourceが指定されたとき補足ナレッジセクションに埋め込まれる", () => {
    const result = buildBillChatSystemHardPrompt(
      "a",
      "b",
      "c",
      "d",
      "補足知識テキスト"
    );

    expect(result).toContain("補足ナレッジ");
    expect(result).toContain("<knowledge_source>");
    expect(result).toContain("補足知識テキスト");
  });
});
