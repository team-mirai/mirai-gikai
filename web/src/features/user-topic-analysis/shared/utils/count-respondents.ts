import type { PublicTopic } from "../types";

/**
 * 公開トピックに意見が割り当たっている回答者（出典レポート）のユニーク数。
 * トピック一覧のピルと回答一覧の「N人」を同一基準にするための純粋関数。
 */
export function countTopicRespondents(topics: PublicTopic[]): number {
  const reportIds = new Set<string>();
  for (const topic of topics) {
    for (const opinion of topic.opinions) {
      reportIds.add(opinion.interview_report_id);
    }
  }
  return reportIds.size;
}
