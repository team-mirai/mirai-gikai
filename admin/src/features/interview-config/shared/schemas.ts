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
 * 初期テンプレート用: 法案ごとに Q1 / Q4 を全文生成する
 */
const generatedQuestionSchema = z.object({
  question: z.string().describe("質問文"),
  follow_up_guide: z.string().describe("フォローアップ指針"),
  quick_replies: z
    .array(z.string())
    .describe("クイックリプライの選択肢（5件）"),
});

export const defaultQuestionsGenerationSchema = z.object({
  text: z.string().describe("AIの説明テキスト"),
  q1: generatedQuestionSchema.describe(
    "Q1（法案との関わり・立場）の法案別生成"
  ),
  q4: generatedQuestionSchema.describe(
    "Q4（特に気になっている点）の法案別生成"
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
const quickRepliesGenerationShape = z.object({
  question: z.string().optional(),
  follow_up_guide: z.string().optional(),
  quick_replies: z.array(z.string()).optional(),
});

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
  q1: quickRepliesGenerationShape.optional(),
  q4: quickRepliesGenerationShape.optional(),
  stage: configGenerationStageSchema.optional(),
});

export type ConfigGenerationResponse = z.infer<
  typeof configGenerationResponseSchema
>;
