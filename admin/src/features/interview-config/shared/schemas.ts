import { z } from "zod";

/**
 * AI設定生成の処理ステージ
 */
export const configGenerationStageSchema = z.enum([
  "theme_proposal",
  "theme_confirmed",
  "question_proposal",
  "question_confirmed",
]);

export type ConfigGenerationStage = z.infer<typeof configGenerationStageSchema>;

/**
 * テーマ提案フェーズ用のLLM出力スキーマ
 */
export const themeProposalSchema = z.object({
  text: z.string().describe("AIの説明テキスト"),
  themes: z.array(z.string()).describe("提案するテーマの配列"),
});

export type ThemeProposal = z.infer<typeof themeProposalSchema>;

/**
 * 質問提案フェーズ用のLLM出力スキーマ
 */
export const questionProposalSchema = z.object({
  text: z.string().describe("AIの説明テキスト"),
  questions: z
    .array(
      z.object({
        question: z.string().describe("質問文"),
        instruction: z
          .string()
          .nullable()
          .describe("AIへの指示（深掘り方法など）"),
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
        instruction: z.string().optional(),
        quick_replies: z.array(z.string()).optional(),
      })
    )
    .optional(),
  stage: configGenerationStageSchema.optional(),
});

export type ConfigGenerationResponse = z.infer<
  typeof configGenerationResponseSchema
>;
