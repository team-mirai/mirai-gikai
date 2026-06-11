import "server-only";

import {
  locateTopic,
  type TopicLocation,
} from "../../shared/utils/locate-topic";
import { getPublicTopicAnalysis } from "./get-public-topic-analysis";

/**
 * 議案の公開トピック分析から、指定トピックの詳細（表示順・前後トピック含む）を取得する。
 * 公開版が無い、または該当トピックが無ければ null。
 */
export async function getPublicTopicDetail(
  billId: string,
  topicId: string
): Promise<TopicLocation | null> {
  const analysis = await getPublicTopicAnalysis(billId);
  if (!analysis) return null;
  return locateTopic(analysis.topics, topicId);
}
