import "server-only";

import type { PublicOpinion } from "../../shared/types";
import { getPublicTopicAnalysis } from "./get-public-topic-analysis";

export type PublicBillOpinions = {
  opinions: PublicOpinion[];
  /** 回答者（出典レポート）数。一覧見出しの「N人」に使う。 */
  respondentCount: number;
};

/**
 * 議案の公開トピック分析から、全トピック横断で公開意見をフラットに取得する。
 * AIインタビュー回答一覧（議案単位の意見一覧）で使用する。
 * 同一意見が複数トピックに割り当たっている場合は id で重複排除する。
 */
export async function getPublicBillOpinions(
  billId: string
): Promise<PublicBillOpinions> {
  const analysis = await getPublicTopicAnalysis(billId);
  if (!analysis) return { opinions: [], respondentCount: 0 };

  const byId = new Map<string, PublicOpinion>();
  for (const topic of analysis.topics) {
    for (const opinion of topic.opinions) {
      byId.set(opinion.id, opinion);
    }
  }
  const opinions = [...byId.values()];
  const respondentCount = new Set(opinions.map((o) => o.interview_report_id))
    .size;

  return { opinions, respondentCount };
}
