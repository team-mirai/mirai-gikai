import { z } from "zod";

/**
 * AI設定生成の処理ステージ
 *
 * フロー: default_questions → question_proposal → question_confirmed
 *       → theme_proposal → theme_confirmed
 */
export const configGenerationStageSchema = z.enum([
  "default_questions",
  "question_proposal",
  "question_confirmed",
  "theme_proposal",
  "theme_confirmed",
]);

export type ConfigGenerationStage = z.infer<typeof configGenerationStageSchema>;

/**
 * 初期テンプレート用: 法案ごとに Q1 / Q2 の quick_replies のみ LLM 生成する。
 * 質問文・フォローアップ指針は固定のためここでは出力しない。
 */
export const defaultQuestionsGenerationSchema = z.object({
  text: z.string().describe("AIの説明テキスト"),
  q1: z
    .array(z.string())
    .describe(
      "Q1（関心のあるテーマ選択）のクイックリプライ（5件、法案固有の論点名）"
    ),
  q2: z
    .array(z.string())
    .describe(
      "Q2（立場・関わり方）のクイックリプライ（5件、法案の影響を受ける立場・属性）"
    ),
});

export type DefaultQuestionsGeneration = z.infer<
  typeof defaultQuestionsGenerationSchema
>;

/**
 * テーマ提案フェーズ用のLLM出力スキーマ
 */
export const themeProposalSchema = z.object({
  text: z.string().describe("AIの説明テキスト"),
  themes: z.array(z.string()).describe("提案するテーマの配列"),
});

export type ThemeProposal = z.infer<typeof themeProposalSchema>;

/**
 * 質問提案フェーズ用のLLM出力スキーマ（ブラッシュアップ時に使用）
 */
export const questionProposalSchema = z.object({
  text: z.string().describe("AIの説明テキスト"),
  questions: z
    .array(
      z.object({
        question: z.string().describe("質問文"),
        follow_up_guide: z
          .string()
          .nullable()
          .describe("フォローアップ指針（深掘り方法など）"),
        quick_replies: z
          .array(z.string())
          .nullable()
          .describe("クイックリプライの選択肢"),
      })
    )
    .describe("提案する質問の配列"),
});

export type QuestionProposal = z.infer<typeof questionProposalSchema>;

/**
 * クライアント側で使う統一レスポンススキーマ
 * stage フィールドはサーバー側で injectJsonFields により注入される
 */
export const configGenerationResponseSchema = z.object({
  text: z.string(),
  themes: z.array(z.string()).optional(),
  questions: z
    .array(
      z.object({
        question: z.string(),
        follow_up_guide: z.string().optional(),
        quick_replies: z.array(z.string()).optional(),
      })
    )
    .optional(),
  q1: z.array(z.string()).optional(),
  q2: z.array(z.string()).optional(),
  stage: configGenerationStageSchema.optional(),
});

export type ConfigGenerationResponse = z.infer<
  typeof configGenerationResponseSchema
>;
