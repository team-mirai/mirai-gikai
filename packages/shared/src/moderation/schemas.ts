import { z } from "zod";

// モデレーション用スコア値（0-100、LLMが小数点を返す可能性があるため丸める）
const moderationScoreValueSchema = z
  .number()
  .transform((v) => Math.round(v))
  .pipe(z.number().int().min(0).max(100));

// モデレーション結果スキーマ（generateObject用）
export const moderationResultSchema = z.object({
  score: moderationScoreValueSchema.describe(
    "モデレーションスコア（0-100の整数）: 0が最も適切、100が最も不適切"
  ),
  reasoning: z.string().describe("スコアの根拠を簡潔に説明（200文字以内）"),
});

export type ModerationResult = z.infer<typeof moderationResultSchema>;
