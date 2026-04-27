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
 *
 * フィールド名は意味ベース（topics/stance）にして LLM の混同を防ぐ。
 */
export const defaultQuestionsGenerationSchema = z.object({
  text: z.string().describe("AIの説明テキスト"),
  topics: z
    .array(z.string())
    .describe(
      "関心のあるテーマ（論点）の選択肢。法案固有の論点名を5件（例: 『AI利用』『罰則』『データ保護』のような論点）。立場・属性は絶対に入れない。"
    ),
  stance: z
    .array(z.string())
    .describe(
      "立場・関わり方の選択肢。法案の影響を受けそうな立場・属性を5件（例: 『仕事で〜』『〜の利用者』『〜の保護者』のような人の属性）。論点・テーマは絶対に入れない。汎用枠として『一般市民として関心がある』を必ず含めること。"
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
  topics: z.array(z.string()).optional(),
  stance: z.array(z.string()).optional(),
  stage: configGenerationStageSchema.optional(),
});

export type ConfigGenerationResponse = z.infer<
  typeof configGenerationResponseSchema
>;
