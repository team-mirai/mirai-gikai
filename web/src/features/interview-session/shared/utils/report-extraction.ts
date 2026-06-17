import { z } from "zod";
import { type InterviewReportData, interviewReportSchema } from "../schemas";

/**
 * 保存済みメッセージからレポートを抽出するためのスキーマ
 * next_stageはレスポンス時のみ必要なため、抽出時は不要
 */
const reportExtractionSchema = z.object({
  text: z.string(),
  report: interviewReportSchema,
});

/**
 * 後方互換: 旧メッセージの opinions には contextual_quote / bill_sentiment /
 * richness が存在しないため、欠落フィールドを null で補完してから検証する。
 * これにより新フィールド追加前に生成された要約メッセージでも抽出が失敗せず、
 * インタビュー完了がブロックされない（§4.0）。
 */
function backfillOpinionFields(parsed: unknown): unknown {
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("report" in parsed) ||
    !parsed.report ||
    typeof parsed.report !== "object" ||
    !("opinions" in parsed.report) ||
    !Array.isArray(parsed.report.opinions)
  ) {
    return parsed;
  }

  const opinions = parsed.report.opinions.map((opinion) =>
    opinion && typeof opinion === "object"
      ? {
          contextual_quote: null,
          bill_sentiment: null,
          richness: null,
          ...opinion,
        }
      : opinion
  );

  return { ...parsed, report: { ...parsed.report, opinions } };
}

/**
 * メッセージからレポートを抽出する
 */
export function extractReportFromMessage(
  content: string
): InterviewReportData | null {
  try {
    const parsed = backfillOpinionFields(JSON.parse(content));
    const result = reportExtractionSchema.safeParse(parsed);
    if (result.success) {
      return result.data.report;
    }
  } catch (e) {
    // JSONでない場合は無視
    console.error("Failed to parse report from message content", content, e);
  }
  return null;
}
