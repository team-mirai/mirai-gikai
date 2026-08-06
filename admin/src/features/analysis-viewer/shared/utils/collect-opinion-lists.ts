import type { ReasoningType } from "@mirai-gikai/shared/interview-report/opinion-tags";
import type { FlatOpinion, ViewerBigTopic, ViewerOpinion } from "../types";
import { flattenOpinions } from "./build-viewer-hierarchy";

export type { FlatOpinion };

/**
 * 懸念の一覧。`concern` が入っている意見を richness 降順で返す。
 * 質疑で「現場ではこういう不安がある」を引くための入口。
 */
export function collectConcerns(
  bigTopics: readonly ViewerBigTopic[]
): FlatOpinion[] {
  return byRichnessDesc(
    flattenOpinions(bigTopics).filter((o) => o.concern !== null)
  );
}

/**
 * 具体提案の一覧。`proposal` が入っている意見を richness 降順で返す。
 */
export function collectProposals(
  bigTopics: readonly ViewerBigTopic[]
): FlatOpinion[] {
  return byRichnessDesc(
    flattenOpinions(bigTopics).filter((o) => o.proposal !== null)
  );
}

/**
 * 専門知識・研究引用・海外事例を根拠にした意見。
 *
 * 質疑で引用に耐えるのはこの3種で、なかでも研究引用と海外事例は件数が少ないぶん
 * 探しに行く価値が高い。上に来るよう根拠の希少さで重み付けしてから richness で並べる。
 */
const GROUNDED_REASONING_WEIGHT: Partial<Record<ReasoningType, number>> = {
  research_reference: 3,
  overseas_example: 2,
  professional_expertise: 1,
};

export function collectGroundedOpinions(
  bigTopics: readonly ViewerBigTopic[]
): FlatOpinion[] {
  return flattenOpinions(bigTopics)
    .map((opinion) => ({ opinion, weight: groundingWeight(opinion) }))
    .filter((entry) => entry.weight > 0)
    .sort(
      (a, b) =>
        b.weight - a.weight ||
        (b.opinion.richness ?? -1) - (a.opinion.richness ?? -1)
    )
    .map((entry) => entry.opinion);
}

function groundingWeight(opinion: ViewerOpinion): number {
  let weight = 0;
  for (const type of opinion.reasoningTypes) {
    weight = Math.max(weight, GROUNDED_REASONING_WEIGHT[type] ?? 0);
  }
  return weight;
}

/**
 * 意見の全文検索（部分一致）。
 * タイトル・本文・引用・懸念・提案・トピック名を対象にする。
 * 空クエリなら空配列を返す（全件を出すと検索の意味がないため）。
 */
export function searchOpinions(
  bigTopics: readonly ViewerBigTopic[],
  query: string
): FlatOpinion[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  return byRichnessDesc(
    flattenOpinions(bigTopics).filter((opinion) =>
      [
        opinion.title,
        opinion.content,
        opinion.contextualQuote,
        opinion.concern,
        opinion.proposal,
        opinion.roleTitle,
        opinion.bigTopicTitle,
        opinion.mediumTopicTitle,
      ].some((field) => field?.toLowerCase().includes(needle))
    )
  );
}

/** richness 降順。null は最後尾。同点は元順序を保つ（V8 の安定ソート）。 */
function byRichnessDesc(opinions: FlatOpinion[]): FlatOpinion[] {
  return [...opinions].sort((a, b) => (b.richness ?? -1) - (a.richness ?? -1));
}
