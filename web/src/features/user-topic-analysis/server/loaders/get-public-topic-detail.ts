import "server-only";

import {
  filterAndSortTopics,
  type TopicFilter,
} from "../../shared/utils/filter-topics";
import {
  locateTopic,
  type TopicLocation,
} from "../../shared/utils/locate-topic";
import { getPublicTopicAnalysis } from "./get-public-topic-analysis";

/**
 * 議案の公開トピック分析から、指定トピックの詳細（表示順・前後トピック含む）を取得する。
 *
 * filter が指定されている場合、前後トピックは一覧と同じ絞り込み・並び順の中で算出する
 * （一覧でフィルタしたまま詳細を辿れるようにするため）。該当トピックがフィルタ後の集合に
 * 無い場合は全件の並びで算出する。公開版が無い、またはトピックが無ければ null。
 */
export async function getPublicTopicDetail(
  billId: string,
  topicId: string,
  filter: TopicFilter = "all"
): Promise<TopicLocation | null> {
  const analysis = await getPublicTopicAnalysis(billId);
  if (!analysis) return null;
  const ordered = filterAndSortTopics(analysis.topics, filter);
  return locateTopic(ordered, topicId) ?? locateTopic(analysis.topics, topicId);
}
