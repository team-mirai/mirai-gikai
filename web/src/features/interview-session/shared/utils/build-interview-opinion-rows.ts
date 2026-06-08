import type { InterviewOpinionInsert } from "../types";

/**
 * interview_report.opinions(JSONB) に格納されている意見の形。
 * source_message_content など本テーブルに無いフィールドは無視する。
 */
export type InterviewOpinionSource = {
  title: string;
  content: string;
  source_message_id?: string | null;
  contextual_quote?: string | null;
  bill_sentiment?: string | null;
};

/**
 * レポートの意見配列から interview_opinion の upsert 行を生成する純粋関数。
 * opinion_index は配列順（0始まり）で安定させ、
 * dual-write 時の ON CONFLICT (interview_report_id, opinion_index) のキーにする（§3.1）。
 */
export function buildInterviewOpinionRows(
  reportId: string,
  opinions: InterviewOpinionSource[]
): InterviewOpinionInsert[] {
  return opinions.map((opinion, index) => ({
    interview_report_id: reportId,
    opinion_index: index,
    title: opinion.title,
    content: opinion.content,
    source_message_id: opinion.source_message_id ?? null,
    contextual_quote: opinion.contextual_quote ?? null,
    bill_sentiment: opinion.bill_sentiment ?? null,
  }));
}
