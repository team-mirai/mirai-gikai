import type {
  FinalTopicWithId,
  OpinionAssignment,
  TopicDraft,
} from "../shared/types";

export type TopicOpinionPair = {
  opinion_id: string;
  topic_index: number;
};

/**
 * 割当結果から、保存用の「表示順トピック」と「意見→トピック割当ペア」を構築する純粋関数。
 * - opinion 件数降順に並べる（§9）
 * - 1件も割り当たらなかったトピックは除外（未分類は元々行を作らない）
 * - topic_index は並べ替え後の index（saveTopicsAndAssignments の sort_order に対応）
 */
export function buildSortedTopicsAndPairs(
  finalTopics: FinalTopicWithId[],
  assignments: OpinionAssignment[]
): { sortedTopics: TopicDraft[]; pairs: TopicOpinionPair[] } {
  const countByLocalId = new Map<string, number>();
  for (const a of assignments) {
    if (a.topic_local_id) {
      countByLocalId.set(
        a.topic_local_id,
        (countByLocalId.get(a.topic_local_id) ?? 0) + 1
      );
    }
  }

  const counted = finalTopics
    .map((t) => ({ topic: t, count: countByLocalId.get(t.local_id) ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);

  const newIndexByLocalId = new Map<string, number>();
  counted.forEach((x, index) => {
    newIndexByLocalId.set(x.topic.local_id, index);
  });

  const sortedTopics: TopicDraft[] = counted.map((x) => ({
    title: x.topic.title,
    description: x.topic.description,
  }));

  const pairs: TopicOpinionPair[] = [];
  for (const a of assignments) {
    if (!a.topic_local_id) continue;
    const idx = newIndexByLocalId.get(a.topic_local_id);
    if (idx === undefined) continue;
    pairs.push({ opinion_id: a.opinion_id, topic_index: idx });
  }

  return { sortedTopics, pairs };
}
