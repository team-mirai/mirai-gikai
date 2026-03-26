import { z } from "zod";

// 0-100の情報充実度値（LLMが小数点を返す可能性があるため丸める）
const contentRichnessValueSchema = z
  .number()
  .transform((v) => Math.round(v))
  .pipe(z.number().int().min(0).max(100));

// 情報充実度スキーマ（generateObject用）
export const contentRichnessResultSchema = z.object({
  total: contentRichnessValueSchema.describe(
    "総合的な情報充実度（0-100の整数）"
  ),
  clarity: contentRichnessValueSchema.describe(
    "論点の明確さ（0-100）— 議論のポイントがはっきり浮かび上がっているか"
  ),
  specificity: contentRichnessValueSchema.describe(
    "具体性（0-100）— 現場の実感や具体的な事例・数値が得られたか"
  ),
  impact: contentRichnessValueSchema.describe(
    "影響への言及（0-100）— 社会的影響や関係者への影響について情報が得られたか"
  ),
  constructiveness: contentRichnessValueSchema.describe(
    "提案の広がり（0-100）— 課題の指摘に加え、改善の方向性や代替案が含まれているか"
  ),
  reasoning: z.string().describe("上記の根拠を簡潔に説明（100文字以内）"),
});

export type ContentRichnessResult = z.infer<typeof contentRichnessResultSchema>;
