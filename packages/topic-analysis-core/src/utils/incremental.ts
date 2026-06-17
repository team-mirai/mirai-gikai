import type {
  ExistingTopic,
  FinalTopicWithId,
  OpinionAssignment,
  TargetOpinion,
  TopicDraft,
} from "../shared/types";

/** getTopicsWithOpinions の戻り（topic + topic_opinion→interview_opinion）の最小形 */
export type RawVersionTopic = {
  title: string;
  description: string;
  topic_opinion?:
    | Array<{ interview_opinion: { id: string } | null } | null>
    | null;
};

/**
 * 既存 version のトピック行を ExistingTopic（title/description/割当意見ID）に変換する純粋関数。
 * 増分分析で前回 version を引き継ぐ（carry-forward）ための入力を作る。
 */
export function toExistingTopics(rows: RawVersionTopic[]): ExistingTopic[] {
  return rows.map((t) => ({
    title: t.title,
    description: t.description,
    opinion_ids: (t.topic_opinion ?? [])
      .map((link) => link?.interview_opinion?.id ?? null)
      .filter((id): id is string => id !== null),
  }));
}

/** 未抽出（topic_extracted_at が null）の意見だけを返す。 */
export function selectUnextractedOpinions(
  opinions: TargetOpinion[]
): TargetOpinion[] {
  return opinions.filter((o) => o.topic_extracted_at == null);
}

export type IncrementalPlan = {
  /** 既存 + 新規トピックに local_id を振った最終集合（e0.. が既存, n0.. が新規） */
  finalTopics: FinalTopicWithId[];
  /** 既存トピックの割当をそのまま引き継いだペア（再割当しない） */
  carriedAssignments: OpinionAssignment[];
  /** まだどのトピックにも割り当てられていない意見（新規＋前回未割当） */
  unassignedOpinions: TargetOpinion[];
};

/**
 * 増分分析の保存計画を組み立てる純粋関数。
 * - 既存トピックは local_id `e{i}`、新規採用トピックは `n{i}` を振る。
 * - 既存の割当は carriedAssignments としてそのまま引き継ぐ（既存トピックは凍結）。
 * - 既存のどのトピックにも割り当てられていない意見を unassignedOpinions として返す
 *   （これを後段で finalTopics 全体に対して割当する）。
 */
export function buildIncrementalPlan(
  existing: ExistingTopic[],
  acceptedNew: TopicDraft[],
  allTargets: TargetOpinion[]
): IncrementalPlan {
  const existingTopics: FinalTopicWithId[] = existing.map((t, i) => ({
    title: t.title,
    description: t.description,
    local_id: `e${i}`,
  }));
  const newTopics: FinalTopicWithId[] = acceptedNew.map((t, i) => ({
    title: t.title,
    description: t.description,
    local_id: `n${i}`,
  }));

  // 現在の対象意見集合。前回 version 以降に対象外（公開撤回・モデレーション変化等）に
  // なった意見は引き継がない（新 version に stale な割当を残さない）。
  const targetIds = new Set(allTargets.map((o) => o.opinion_id));

  const assignedIds = new Set<string>();
  const carriedAssignments: OpinionAssignment[] = [];
  existing.forEach((t, i) => {
    for (const opinionId of t.opinion_ids) {
      // すでに対象外になった意見は引き継がない。
      if (!targetIds.has(opinionId)) continue;
      // 同一意見が複数トピックに重複していても1件に正規化（topic_opinion は本来1意見1トピック）。
      if (assignedIds.has(opinionId)) continue;
      assignedIds.add(opinionId);
      carriedAssignments.push({
        opinion_id: opinionId,
        topic_local_id: `e${i}`,
      });
    }
  });

  const unassignedOpinions = allTargets.filter(
    (o) => !assignedIds.has(o.opinion_id)
  );

  return {
    finalTopics: [...existingTopics, ...newTopics],
    carriedAssignments,
    unassignedOpinions,
  };
}
