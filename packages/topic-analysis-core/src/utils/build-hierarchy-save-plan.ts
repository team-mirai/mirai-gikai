import type { OpinionAssignment, TopicDraft } from "../shared/types";
import type { TopicHierarchy } from "./build-topic-hierarchy";

/** 保存用に平坦化したトピック1行。 */
export type HierarchyTopicRow = TopicDraft & {
  /** 平坦化後の並び順（そのまま topic.sort_order になる）。 */
  sort_order: number;
  /** 親の sort_order。大トピックは null。 */
  parent_sort_order: number | null;
};

export type HierarchySavePlan = {
  topics: HierarchyTopicRow[];
  /** 意見 → 葉トピック（中トピック）の sort_order。 */
  pairs: Array<{ opinion_id: string; topic_index: number }>;
};

/**
 * 階層と割当結果から、保存用の平坦なトピック列と意見の紐付けを作る純粋関数。
 *
 * 並びは「大トピック → その配下の中トピック」の深さ優先。読み出し側が
 * sort_order 昇順で引くだけで階層の表示順になる。
 *
 * 意見が紐づくのは葉（中トピック）だけ。大トピックの件数は配下の合計として
 * 読み出し側が算出する（同じ意見を親子で二重に持つと集計がずれるため）。
 */
export function buildHierarchySavePlan(
  hierarchy: readonly TopicHierarchy[],
  assignments: readonly OpinionAssignment[]
): HierarchySavePlan {
  const topics: HierarchyTopicRow[] = [];
  const sortOrderByLocalId = new Map<string, number>();

  for (const entry of hierarchy) {
    // big が null なら親行を作らず、children をトップレベルに置く。
    let parentSortOrder: number | null = null;
    if (entry.big) {
      parentSortOrder = topics.length;
      topics.push({
        title: entry.big.title,
        description: entry.big.description,
        sort_order: parentSortOrder,
        parent_sort_order: null,
      });
    }

    for (const child of entry.children) {
      sortOrderByLocalId.set(child.local_id, topics.length);
      topics.push({
        title: child.title,
        description: child.description,
        sort_order: topics.length,
        parent_sort_order: parentSortOrder,
      });
    }
  }

  const pairs: HierarchySavePlan["pairs"] = [];
  for (const assignment of assignments) {
    if (!assignment.topic_local_id) continue;
    const topicIndex = sortOrderByLocalId.get(assignment.topic_local_id);
    if (topicIndex === undefined) continue;
    pairs.push({ opinion_id: assignment.opinion_id, topic_index: topicIndex });
  }

  return { topics, pairs };
}

/** 割当結果から local_id ごとの意見件数を数える純粋関数。 */
export function countAssignmentsByLocalId(
  assignments: readonly OpinionAssignment[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const assignment of assignments) {
    const localId = assignment.topic_local_id;
    if (!localId) continue;
    counts.set(localId, (counts.get(localId) ?? 0) + 1);
  }
  return counts;
}
