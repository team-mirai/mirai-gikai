import { describe, expect, it } from "vitest";
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

  describe("default_questionsステージ", () => {
    const params = {
      ...baseParams,
      stage: "default_questions" as const,
    };

    it("Q1/Q2 の固定質問文をプロンプトに含める", () => {
      const result = buildConfigGenerationPrompt(params);
      expect(result).toContain("topics");
      expect(result).toContain("stance");
      expect(result).toContain("テーマを選んでください");
      expect(result).toContain("立場・関わり方");
    });

    it("出力形式に topics / stance を配列で指定する", () => {
      const result = buildConfigGenerationPrompt(params);
      expect(result).toContain("topics: string[]");
      expect(result).toContain("stance: string[]");
    });

    it("クイックリプライを5件指定する指示を含む", () => {
      const result = buildConfigGenerationPrompt(params);
      expect(result).toContain("5件");
    });

    it("クイックリプライの括弧書き禁止ルールを含む", () => {
      const result = buildConfigGenerationPrompt(params);
      expect(result).toContain("括弧書きの補足");
    });

    it("「その他（自由記述）」を LLM 出力に含めない指示", () => {
      const result = buildConfigGenerationPrompt(params);
      expect(result).toContain("その他（自由記述）");
      expect(result).toContain("出力に含めない");
    });
  });

  describe("theme_proposalステージ", () => {
    it("テーマ提案のガイドラインを含む", () => {
      const result = buildConfigGenerationPrompt(baseParams);
      expect(result).toContain("テーマ提案のガイドライン");
    });

    it("出力形式にthemesを指定する", () => {
      const result = buildConfigGenerationPrompt(baseParams);
      expect(result).toContain("themes: テーマの配列");
    });

    it("確定済み質問がある場合、質問一覧を含む", () => {
      const result = buildConfigGenerationPrompt({
        ...baseParams,
        confirmedQuestions: [
          {
            question: "質問A",
            follow_up_guide: "フォローアップ指針A",
            quick_replies: ["選択肢1", "選択肢2"],
          },
          { question: "質問B" },
        ],
      });
      expect(result).toContain("## 確定済みの質問");
      expect(result).toContain("1. 質問A");
      expect(result).toContain("フォローアップ指針: フォローアップ指針A");
      expect(result).toContain("選択肢: 選択肢1, 選択肢2");
      expect(result).toContain("2. 質問B");
    });

    it("既存テーマがある場合、ブラッシュアップ指示を含む", () => {
      const result = buildConfigGenerationPrompt({
        ...baseParams,
        existingThemes: ["既存テーマ1", "既存テーマ2"],
      });
      expect(result).toContain("## 現在設定されているテーマ");
      expect(result).toContain("- 既存テーマ1");
      expect(result).toContain("ブラッシュアップ");
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
    });

    it("出力形式にquestionsを指定する", () => {
      const result = buildConfigGenerationPrompt(questionParams);
      expect(result).toContain("questions: 質問オブジェクトの配列");
    });

    it("既存質問がある場合、ブラッシュアップ指示を含む", () => {
      const result = buildConfigGenerationPrompt({
        ...questionParams,
        existingQuestions: [
          {
            question: "既存質問1",
            follow_up_guide: "既存フォローアップ",
            quick_replies: ["選択肢1"],
          },
        ],
      });
      expect(result).toContain("## 現在設定されている質問");
      expect(result).toContain("1. 既存質問1");
      expect(result).toContain("フォローアップ指針: 既存フォローアップ");
      expect(result).toContain("選択肢: 選択肢1");
      expect(result).toContain("ブラッシュアップ");
    });

    it("各質問フィールドの説明を含む", () => {
      const result = buildConfigGenerationPrompt(questionParams);
      expect(result).toContain("question: 質問文");
      expect(result).toContain("follow_up_guide: フォローアップ指針");
      expect(result).toContain("quick_replies: クイックリプライの選択肢");
    });

    it("クイックリプライの括弧書き禁止ルールを含む", () => {
      const result = buildConfigGenerationPrompt(questionParams);
      expect(result).toContain("括弧書きの補足");
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
