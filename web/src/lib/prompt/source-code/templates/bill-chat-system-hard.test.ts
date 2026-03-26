import { describe, expect, it } from "vitest";
import { buildBillChatSystemHardPrompt } from "./bill-chat-system-hard";

describe("buildBillChatSystemHardPrompt", () => {
  it("4つのパラメータがプロンプトに埋め込まれる", () => {
    const result = buildBillChatSystemHardPrompt(
      "テスト法案名",
      "テスト法案タイトル",
      "テスト法案要約",
      "テスト法案詳細"
    );

    expect(result).toContain("テスト法案名");
    expect(result).toContain("テスト法案タイトル");
    expect(result).toContain("テスト法案要約");
    expect(result).toContain("テスト法案詳細");
  });

  it("難易度「難しい」セクションが含まれる", () => {
    const result = buildBillChatSystemHardPrompt("a", "b", "c", "d");

    expect(result).toContain("回答の難易度：難しい");
    expect(result).toContain("専門用語を正確に使用");
  });

  it("みらい議会の説明が含まれる", () => {
    const result = buildBillChatSystemHardPrompt("a", "b", "c", "d");

    expect(result).toContain("みらい議会");
    expect(result).toContain("チームみらい");
  });
});
