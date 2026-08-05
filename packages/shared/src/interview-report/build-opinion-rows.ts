import type { Database } from "@mirai-gikai/supabase";
import { normalizeRichnessScore } from "../content-richness/normalize-richness-score";
import { normalizeReasoningTypes } from "./opinion-tags";
import type { InterviewOpinionSource } from "./schema";

export type InterviewOpinionInsert =
  Database["public"]["Tables"]["interview_opinion"]["Insert"];

export type BuildOpinionRowsOptions = {
  /**
   * タグ（concern/proposal/reasoning_types）の抽出時刻。
   * レポート生成と同時にタグも得られる経路（ライブ生成・再抽出）で現在時刻を渡す。
   *
   * ただし**意見ごとに、実際にタグが載っている行だけ**ウォーターマークを立てる。
   * 新フィールド追加前に生成された要約メッセージから完了したセッションは
   * report-extraction の後方互換パスが reasoning_types を null で補完するため、
   * 無条件に立てるとタグ空のまま「抽出済み」になりバックフィルから永久に漏れる。
   * 判別材料は reasoning_types の有無（新プロンプトは根拠不明でも ["none"] を返す）。
   */
  tagsExtractedAtIso?: string;
};

/**
 * レポートの意見配列から interview_opinion の upsert 行を生成する純粋関数。
 * opinion_index は配列順（0始まり）で安定させ、
 * dual-write 時の ON CONFLICT (interview_report_id, opinion_index) のキーにする（§3.1）。
 */
export function buildInterviewOpinionRows(
  reportId: string,
  opinions: InterviewOpinionSource[],
  options: BuildOpinionRowsOptions = {}
): InterviewOpinionInsert[] {
  const { tagsExtractedAtIso } = options;
  return opinions.map((opinion, index) => ({
    interview_report_id: reportId,
    opinion_index: index,
    title: opinion.title,
    content: opinion.content,
    source_message_id: opinion.source_message_id ?? null,
    contextual_quote: opinion.contextual_quote ?? null,
    bill_sentiment: opinion.bill_sentiment ?? null,
    richness: normalizeRichnessScore(opinion.richness),
    concern: opinion.concern ?? null,
    proposal: opinion.proposal ?? null,
    reasoning_types: normalizeReasoningTypes(opinion.reasoning_types),
    tags_extracted_at:
      tagsExtractedAtIso && opinion.reasoning_types != null
        ? tagsExtractedAtIso
        : null,
  }));
}
