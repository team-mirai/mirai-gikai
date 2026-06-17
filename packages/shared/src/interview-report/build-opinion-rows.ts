import type { Database } from "@mirai-gikai/supabase";
import { normalizeRichnessScore } from "../content-richness/normalize-richness-score";
import type { InterviewOpinionSource } from "./schema";

export type InterviewOpinionInsert =
  Database["public"]["Tables"]["interview_opinion"]["Insert"];

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
    richness: normalizeRichnessScore(opinion.richness),
  }));
}
