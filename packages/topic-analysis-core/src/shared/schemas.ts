import { z } from "zod";

const topicItemSchema = z.object({
  title: z
    .string()
    .describe(
      "意見群の核心となる主張を1文で表したタイトル（「〜すべきだ」「〜を懸念する」等・20字以内）。体言止め（「〜の確保」「〜の明確化」等）で終えず必ず述語で締める。複数論点を「〜と〜」で詰め込まず1つの主張に絞り、ひと目で何を主張しているか分かる文にする"
    ),
  // 改行区切り文字列をモデルに生成させると `\n` の有無が出力ごとにばらつくため、
  // 要点を配列で受け取りコード側で確実に改行結合する（joinSummaryPoints）。
  description_points: z
    .array(z.string())
    .describe(
      "対象意見群の要点を最大3個の箇条書きで示す。各要素は1つの要点を表す簡潔な1文（40字程度）で、必ず述語で締める（体言止め・名詞止め禁止）。「・」等の記号や番号は付けず、文だけを入れる。1要素=1論点に絞る"
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
