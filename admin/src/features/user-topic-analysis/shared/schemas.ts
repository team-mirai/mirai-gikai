import { z } from "zod";

const topicItemSchema = z.object({
  title: z
    .string()
    .describe("主張文体のトピックタイトル（「〜すべきだ」等・20字以内）"),
  description: z
    .string()
    .describe(
      "対象意見群を要約する自然な文章（80〜150字程度・複数文可）。体言止め（「〜という期待。」「〜という懸念。」等）で終えず必ず述語で締める。論点の核に加え、代表的な声・具体的経験・制度と現場の乖離などの示唆に触れる"
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
