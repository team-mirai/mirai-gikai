import {
  type OpinionAudience,
  opinionPassesAudience,
} from "@mirai-gikai/shared/interview-report/opinion-tags";
import type {
  FlatOpinion,
  RawViewerTopic,
  ViewerBigTopic,
  ViewerMediumTopic,
  ViewerOpinion,
} from "../types";

/**
 * 生のトピック行から、audience で絞った2階層を組み立てる純粋関数。
 *
 * - 意見が紐づくのは葉（中トピック）だけ。大トピックの件数は配下の合計
 * - audience で意見を絞った結果0件になった中トピックは出さない
 * - 中トピックが1つも残らない大トピックも出さない
 * - 親を持たない葉（2階層化以前の version やフラットに倒れた version）は
 *   「大トピック無し」のグループにまとめる
 *
 * 大トピックも中トピックも件数降順。読み手が上から見て網羅チェックできる並びにする。
 */
export const UNGROUPED_BIG_TOPIC_TITLE = "グループ未分類";

export function buildViewerHierarchy(
  topics: readonly RawViewerTopic[],
  audience: OpinionAudience
): ViewerBigTopic[] {
  const passes = (opinion: ViewerOpinion) =>
    opinionPassesAudience(audience, {
      role: opinion.role,
      reasoning_types: opinion.reasoningTypes,
    });

  const childrenByParent = new Map<string, RawViewerTopic[]>();
  const parents: RawViewerTopic[] = [];
  const looseTopics: RawViewerTopic[] = [];

  const hasChildren = new Set(
    topics
      .map((t) => t.parent_topic_id)
      .filter((id): id is string => id !== null)
  );

  for (const topic of topics) {
    const isChild = topic.parent_topic_id !== null;
    const isBig = !isChild && hasChildren.has(topic.id);

    if (isBig) {
      parents.push(topic);
      // 大トピックに意見が直接付くのは不変条件の破れ（select-leaf-topics 参照）。
      // 消すと件数が合わなくなるので、未分類側に逃がして見えるようにする。
      if (topic.opinions.length > 0) looseTopics.push(topic);
      continue;
    }
    if (isChild) {
      const siblings =
        childrenByParent.get(topic.parent_topic_id as string) ?? [];
      siblings.push(topic);
      childrenByParent.set(topic.parent_topic_id as string, siblings);
      continue;
    }
    looseTopics.push(topic);
  }

  const toMedium = (topic: RawViewerTopic): ViewerMediumTopic | null => {
    const opinions = topic.opinions.filter(passes);
    if (opinions.length === 0) return null;
    return {
      id: topic.id,
      title: topic.title,
      description: topic.description,
      opinions,
    };
  };

  const bigTopics: ViewerBigTopic[] = [];

  for (const parent of parents) {
    const mediumTopics = (childrenByParent.get(parent.id) ?? [])
      .map(toMedium)
      .filter((m): m is ViewerMediumTopic => m !== null);
    if (mediumTopics.length === 0) continue;
    bigTopics.push({
      id: parent.id,
      title: parent.title,
      description: parent.description,
      mediumTopics: sortMediumsByCount(mediumTopics),
      opinionCount: countOpinions(mediumTopics),
    });
  }

  // 親が大トピックとして描画されなかった子（3階層目など）も未分類へ回収する。
  const renderedChildIds = new Set(
    parents.flatMap((p) => (childrenByParent.get(p.id) ?? []).map((c) => c.id))
  );
  const unreachableChildren = topics.filter(
    (t) => t.parent_topic_id !== null && !renderedChildIds.has(t.id)
  );

  const ungrouped = [...looseTopics, ...unreachableChildren]
    .map(toMedium)
    .filter((m): m is ViewerMediumTopic => m !== null);
  if (ungrouped.length > 0) {
    bigTopics.push({
      id: "ungrouped",
      title: UNGROUPED_BIG_TOPIC_TITLE,
      description: "大トピックに束ねられていない論点。",
      mediumTopics: sortMediumsByCount(ungrouped),
      opinionCount: countOpinions(ungrouped),
    });
  }

  return bigTopics.sort((a, b) => b.opinionCount - a.opinionCount);
}

function sortMediumsByCount(mediums: ViewerMediumTopic[]): ViewerMediumTopic[] {
  return [...mediums].sort((a, b) => b.opinions.length - a.opinions.length);
}

function countOpinions(mediums: readonly ViewerMediumTopic[]): number {
  return mediums.reduce((sum, m) => sum + m.opinions.length, 0);
}

/** 階層に含まれる意見をすべて平坦に取り出す（リスト表示・検索用）。 */
export function flattenOpinions(
  bigTopics: readonly ViewerBigTopic[]
): FlatOpinion[] {
  return bigTopics.flatMap((big) =>
    big.mediumTopics.flatMap((medium) =>
      medium.opinions.map((opinion) => ({
        ...opinion,
        bigTopicTitle: big.title,
        mediumTopicTitle: medium.title,
      }))
    )
  );
}
