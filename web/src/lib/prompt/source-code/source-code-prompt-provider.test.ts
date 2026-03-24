import { describe, expect, it } from "vitest";
import { SourceCodePromptProvider } from "./source-code-prompt-provider";

describe("SourceCodePromptProvider", () => {
  const provider = new SourceCodePromptProvider();

  it("top-chat-system プロンプトを変数付きで返す", async () => {
    const result = await provider.getPrompt("top-chat-system", {
      billSummary: '[{"id":"1","name":"テスト法案"}]',
    });

    expect(result.content).toContain("みらい議会");
    expect(result.content).toContain('[{"id":"1","name":"テスト法案"}]');
  });

  it("metadata にソースコード情報を含む", async () => {
    const result = await provider.getPrompt("top-chat-system", {
      billSummary: "test",
    });

    const metadata = JSON.parse(result.metadata);
    expect(metadata.source).toBe("source-code");
    expect(metadata.name).toBe("top-chat-system");
  });

  it("存在しないプロンプト名でエラーをスローする", async () => {
    await expect(provider.getPrompt("nonexistent-prompt")).rejects.toThrow(
      'Source code prompt not found: "nonexistent-prompt"'
    );
  });

  it("変数なしでも呼び出せる", async () => {
    const result = await provider.getPrompt("top-chat-system");

    expect(result.content).toContain("みらい議会");
  });
});
