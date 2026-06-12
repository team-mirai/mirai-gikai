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
      "対象意見群の要点を箇条書き（最大3行）で示す説明。1要点=1文を改行(\\n)で区切り、平文の段落にしない。「・」等の箇条書き記号や番号は付けない。各行は40字程度の簡潔な1文で述語で締める（体言止めで終えない）"
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
