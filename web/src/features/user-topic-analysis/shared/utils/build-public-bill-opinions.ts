import type { PublicOpinion, RawOpinionRow } from "../types";
import { mapRoleToCategory } from "./build-public-topic-analysis";

/** 公開レポート（管理者公開 × ユーザー公開）と同一基準で表示可否を判定する。 */
function isDisplayable(o: RawOpinionRow): boolean {
  return o.is_public_by_admin === true && o.is_public_by_user === true;
}

function toBillSentiment(value: string | null): "期待" | "懸念" | null {
  return value === "期待" || value === "懸念" ? value : null;
}

/**
 * 議案の生意見行（トピック割当の有無を問わない全件）から、表示用の意見一覧を構築する純粋関数。
 * 公開レポート（管理者公開 × ユーザー公開）でフィルタする。
 */
export function buildPublicBillOpinions(
  rows: RawOpinionRow[]
): PublicOpinion[] {
  const opinions: PublicOpinion[] = [];
  for (const o of rows) {
    if (!isDisplayable(o)) continue;
    opinions.push({
      id: o.id,
      interview_report_id: o.interview_report_id,
      report_public: o.is_public_by_admin,
      created_at: o.created_at,
      title: o.title,
      content: o.content,
      user_category: mapRoleToCategory(o.role),
      role_title: o.role_title,
      bill_sentiment: toBillSentiment(o.bill_sentiment),
      contextual_quote: o.contextual_quote,
      richness: o.richness,
      source_message_id: o.source_message_id,
      question_snippet: null,
    });
  }
  return opinions;
}
