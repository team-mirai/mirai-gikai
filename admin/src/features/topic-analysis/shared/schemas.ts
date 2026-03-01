import { z } from "zod";

// Step 1: トピック抽出
export const topicExtractionSchema = z.object({
  topics: z.array(
    z.object({
      name: z
        .string()
        .describe("トピック名（40文字以内、具体的な内容を含む1文）"),
    })
  ),
});
export type TopicExtractionResult = z.infer<typeof topicExtractionSchema>;

// Step 2: トピックマージ
export const topicMergeSchema = z.object({
  merged_topics: z.array(
    z.object({
      name: z.string().describe("マージ後のトピック名"),
      original_names: z.array(z.string()).describe("マージ元のトピック名一覧"),
    })
  ),
});
export type TopicMergeResult = z.infer<typeof topicMergeSchema>;

// Step 3: 意見分類
export const opinionClassificationSchema = z.object({
  classifications: z.array(
    z.object({
      interview_report_id: z.string(),
      opinion_index: z.number(),
      topic_names: z.array(z.string()),
    })
  ),
});
export type OpinionClassificationResult = z.infer<
  typeof opinionClassificationSchema
>;

// Step 4: トピック説明
export const topicReportSchema = z.object({
  description: z
    .string()
    .describe("トピックの説明文（markdown形式、[ref:N]マーカー付き）"),
  references: z.array(
    z.object({
      ref_id: z.number(),
      session_id: z.string().describe("参照するインタビューセッションのID"),
    })
  ),
  representative_opinions: z
    .array(
      z.object({
        session_id: z.string(),
        opinion_title: z.string(),
        opinion_content: z.string(),
      })
    )
    .max(5),
});
export type TopicReportResult = z.infer<typeof topicReportSchema>;

// Step 5: 全体サマリ
export const overallSummarySchema = z.object({
  summary: z.string().describe("レポート全体のサマリ文章（markdown形式）"),
});
export type OverallSummaryResult = z.infer<typeof overallSummarySchema>;
