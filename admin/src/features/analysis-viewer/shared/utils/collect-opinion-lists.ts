import type { ReasoningType } from "@mirai-gikai/shared/interview-report/opinion-tags";
import type { FlatOpinion, ViewerBigTopic } from "../types";
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
 * 専門知識・研究引用・海外事例を根拠にした意見。質疑で引用に耐えるのはこの3種。
 *
 * **根拠の種類では並べ替えない。** 当初は希少な根拠を上に出す重み付け（研究引用3・
 * 海外事例2・専門知識1）を入れていたが、ローカル実データで research_reference の
 * 誤検出を確認したため外した。同一発言に対してタグ付けの実行ごとに research_reference
 * が付いたり付かなかったりし、付いた3件はいずれも発言原文に調査・研究への言及が無い。
 *
 * 誤検出を最優先で上に出すと、引用候補の先頭に裏付けの無い発言が並ぶ。逐語引用を
 * 委員会質疑に持ち出す導線なので、希少な根拠を拾える利得より誤りが混入する損失が
 * 大きいと判断した。richness だけで並べる。
 */
const GROUNDED_REASONING_TYPES: readonly ReasoningType[] = [
  "research_reference",
  "overseas_example",
  "professional_expertise",
];

export function collectGroundedOpinions(
  bigTopics: readonly ViewerBigTopic[]
): FlatOpinion[] {
  return byRichnessDesc(
    flattenOpinions(bigTopics).filter((opinion) =>
      opinion.reasoningTypes.some((type) =>
        GROUNDED_REASONING_TYPES.includes(type)
      )
    )
  );
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
