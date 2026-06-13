import type { PublicOpinion, RawOpinionRow } from "../types";
import { mapRoleToCategory } from "./build-public-topic-analysis";

function isDisplayable(o: RawOpinionRow): boolean {
  return o.is_public_by_user === true && o.moderation_status === "ok";
}

function toBillSentiment(value: string | null): "期待" | "懸念" | null {
  return value === "期待" || value === "懸念" ? value : null;
}

export type PublicBillOpinions = {
  opinions: PublicOpinion[];
  /** 公開意見を持つ回答者（出典レポート）のユニーク数。 */
  respondentCount: number;
};

/**
 * 議案の生意見行（トピック割当の有無を問わない全件）から、表示用の意見一覧を構築する純粋関数。
 * §8（公開同意 × モデレーションOK）でフィルタし、回答者数も同集合から数える。
 */
export function buildPublicBillOpinions(
  rows: RawOpinionRow[]
): PublicBillOpinions {
  const opinions: PublicOpinion[] = [];
  const reportIds = new Set<string>();
  for (const o of rows) {
    if (!isDisplayable(o)) continue;
    reportIds.add(o.interview_report_id);
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
      source_message_id: o.source_message_id,
      question_snippet: null,
    });
  }
  return { opinions, respondentCount: reportIds.size };
}
