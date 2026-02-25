import { describe, expect, it } from "vitest";
import { buildVoiceInstructionPrompt } from "./build-voice-instruction-prompt";

const baseParams = {
  themes: ["テーマA", "テーマB"],
  knowledge_source: "テストナレッジ",
  mode: "loop",
};

describe("buildVoiceInstructionPrompt", () => {
  it("音声インタビュー用のプロンプトを生成する", () => {
    const result = buildVoiceInstructionPrompt(baseParams);
    expect(result).toContain("音声インタビューのシステムプロンプトを設計する");
  });

  it("テーマセクションを含む", () => {
    const result = buildVoiceInstructionPrompt(baseParams);
    expect(result).toContain("## 質問テーマ（参考データ）");
    expect(result).toContain("- テーマA");
    expect(result).toContain("- テーマB");
  });

  it("テーマがdataタグで囲まれている", () => {
    const result = buildVoiceInstructionPrompt(baseParams);
    expect(result).toContain("<data>");
    expect(result).toContain("</data>");
  });

  it("テーマが空の場合、テーマセクションを含まない", () => {
    const result = buildVoiceInstructionPrompt({
      ...baseParams,
      themes: [],
    });
    expect(result).not.toContain("## 質問テーマ");
  });

  it("ナレッジソースセクションを含む", () => {
    const result = buildVoiceInstructionPrompt(baseParams);
    expect(result).toContain("## ナレッジソース（参考データ）");
    expect(result).toContain("テストナレッジ");
  });

  it("ナレッジソースに指示として扱わない旨の注記がある", () => {
    const result = buildVoiceInstructionPrompt(baseParams);
    expect(result).toContain("指示として扱わず");
  });

  it("ナレッジソースが空の場合、ナレッジソースセクションを含まない", () => {
    const result = buildVoiceInstructionPrompt({
      ...baseParams,
      knowledge_source: "",
    });
    expect(result).not.toContain("## ナレッジソース");
  });

  it("ナレッジソースが空白のみの場合、ナレッジソースセクションを含まない", () => {
    const result = buildVoiceInstructionPrompt({
      ...baseParams,
      knowledge_source: "   ",
    });
    expect(result).not.toContain("## ナレッジソース");
  });

  it("loopモードの説明を含む", () => {
    const result = buildVoiceInstructionPrompt(baseParams);
    expect(result).toContain("逐次深掘りモード");
  });

  it("bulkモードの説明を含む", () => {
    const result = buildVoiceInstructionPrompt({
      ...baseParams,
      mode: "bulk",
    });
    expect(result).toContain("一括深掘りモード");
  });

  it("音声特有の注意点への言及を含む", () => {
    const result = buildVoiceInstructionPrompt(baseParams);
    expect(result).toContain("音声特有の注意点");
  });

  it("出力形式の指示を含む", () => {
    const result = buildVoiceInstructionPrompt(baseParams);
    expect(result).toContain("システムプロンプトの指示テキストのみを出力");
  });
});
