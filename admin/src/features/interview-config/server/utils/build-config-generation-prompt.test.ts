import { vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildConfigGenerationPrompt } from "./build-config-generation-prompt";

const baseParams = {
  billName: "テスト法案",
  billTitle: "テストタイトル",
  billSummary: "テスト要約",
  billContent: "テスト内容の詳細",
  stage: "theme_proposal" as const,
};

describe("buildConfigGenerationPrompt", () => {
  describe("共通部分", () => {
    it("ベースロール（専門家の役割）を含む", () => {
      const result = buildConfigGenerationPrompt(baseParams);
      expect(result).toContain("市民インタビューの設計を支援する専門家です");
    });

    it("法案情報セクションを含む", () => {
      const result = buildConfigGenerationPrompt(baseParams);
      expect(result).toContain("## 法案情報");
      expect(result).toContain("法案名: テスト法案");
      expect(result).toContain("タイトル: テストタイトル");
      expect(result).toContain("要約: テスト要約");
      expect(result).toContain("テスト内容の詳細");
    });
  });

  describe("theme_proposalステージ", () => {
    it("テーマ提案のガイドラインを含む", () => {
      const result = buildConfigGenerationPrompt(baseParams);
      expect(result).toContain("テーマを3〜5個提案");
      expect(result).toContain("テーマ提案のガイドライン");
    });

    it("出力形式にthemesを指定する", () => {
      const result = buildConfigGenerationPrompt(baseParams);
      expect(result).toContain("themes: テーマの配列");
    });

    it("ナレッジソースなしの場合、ナレッジソースセクションヘッダーを含まない", () => {
      const result = buildConfigGenerationPrompt(baseParams);
      expect(result).not.toContain(
        "## ナレッジソース（チームの仮説や補足情報）"
      );
    });

    it("ナレッジソースありの場合、ナレッジセクションを含む", () => {
      const result = buildConfigGenerationPrompt({
        ...baseParams,
        knowledgeSource: "チームの仮説内容",
      });
      expect(result).toContain("ナレッジソース");
      expect(result).toContain("チームの仮説内容");
    });

    it("ナレッジソースが空白のみの場合、ナレッジソースセクションヘッダーを含まない", () => {
      const result = buildConfigGenerationPrompt({
        ...baseParams,
        knowledgeSource: "   ",
      });
      expect(result).not.toContain(
        "## ナレッジソース（チームの仮説や補足情報）"
      );
    });
  });

  describe("question_proposalステージ", () => {
    const questionParams = {
      ...baseParams,
      stage: "question_proposal" as const,
    };

    it("質問提案のガイドラインを含む", () => {
      const result = buildConfigGenerationPrompt(questionParams);
      expect(result).toContain("質問提案のガイドライン");
      expect(result).toContain("合計5〜8個の質問を提案する");
    });

    it("出力形式にquestionsを指定する", () => {
      const result = buildConfigGenerationPrompt(questionParams);
      expect(result).toContain("questions: 質問オブジェクトの配列");
    });

    it("確定テーマがある場合、テーマ一覧を含む", () => {
      const result = buildConfigGenerationPrompt({
        ...questionParams,
        confirmedThemes: ["テーマA", "テーマB", "テーマC"],
      });
      expect(result).toContain("## 確定テーマ");
      expect(result).toContain("- テーマA");
      expect(result).toContain("- テーマB");
      expect(result).toContain("- テーマC");
    });

    it("確定テーマがない場合、テーマ未設定と表示する", () => {
      const result = buildConfigGenerationPrompt(questionParams);
      expect(result).toContain("（テーマ未設定）");
    });

    it("各質問フィールドの説明を含む", () => {
      const result = buildConfigGenerationPrompt(questionParams);
      expect(result).toContain("question: 質問文");
      expect(result).toContain("instruction: AIへの指示");
      expect(result).toContain("quick_replies: クイックリプライの選択肢");
    });

    it("ナレッジソースありの場合、ナレッジセクションを含む", () => {
      const result = buildConfigGenerationPrompt({
        ...questionParams,
        knowledgeSource: "補足情報",
      });
      expect(result).toContain("ナレッジソース");
      expect(result).toContain("補足情報");
    });
  });

  describe("不明なステージ", () => {
    it("ベースロールのみを返す", () => {
      const result = buildConfigGenerationPrompt({
        ...baseParams,
        stage: "theme_confirmed" as "theme_proposal",
      });
      expect(result).toContain("市民インタビューの設計を支援する専門家です");
      expect(result).not.toContain("テーマ提案のガイドライン");
      expect(result).not.toContain("質問提案のガイドライン");
    });
  });
});
