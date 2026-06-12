import { z } from "zod";

const topicItemSchema = z.object({
  title: z
    .string()
    .describe(
      "意見群の核心となる主張を1文で表したタイトル（「〜すべきだ」「〜を懸念する」等・20字以内）。体言止め（「〜の確保」「〜の明確化」等）で終えず必ず述語で締める。複数論点を「〜と〜」で詰め込まず1つの主張に絞り、ひと目で何を主張しているか分かる文にする"
    ),
  description: z
    .string()
    .describe(
      "対象意見群の要点を3行（3文）以内で簡潔にまとめた説明。1行1文とし、各文を述語で締める。体言止め（「〜という期待。」「〜という懸念。」等）で終えない。余計な装飾や引用は入れず論点の核を端的に述べる"
    ),
});

/** Phase1 一次抽出（Map）の出力 */
export const topicExtractionSchema = z.object({
  topics: z
    .array(topicItemSchema)
    .describe(
      "このバッチに現れる論点を fine 粒度で抽出したもの。「その他」等の総括トピックは作らない"
    ),
});

/** Phase2 統合（Reduce）の出力 */
export const topicMergeSchema = z.object({
  topics: z
    .array(topicItemSchema)
    .describe(
      "重複・近接を統合した議案全体の最終トピック集合。「その他」等の総括トピックは含めない"
    ),
});
