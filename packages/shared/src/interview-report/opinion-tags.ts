/**
 * 意見タグ（発言の根拠の種類）の定義。
 *
 * 「専門家の意見だけを見る」を interview_report.role だけで実現しようとすると成立しない。
 * role は回答者1人に1つ付く自己申告ベースのラベルで、role=subject_expert は
 * 本番実測で全意見の1%未満しか付かない（学校教育法: 1,904意見中14件）。
 * reasoning_types は意見1件ごとに「その発言が何を根拠にしているか」を持つため、
 * 肩書が一般市民でも職業上の知見に基づく発言なら拾える。
 *
 * 絞り込み（audience）の述語は、GIN インデックスを張った reasoning_types に対する
 * SQL 側の包含検索で行うため、閲覧UIを作る段で追加する。
 */

/** 発言の根拠の種類。専門家フィルタは professional_expertise の包含で判定する。 */
export const REASONING_TYPES = [
  "personal_experience",
  "family_observation",
  "professional_expertise",
  "research_reference",
  "overseas_example",
  "intuition",
  "none",
] as const;

export type ReasoningType = (typeof REASONING_TYPES)[number];

/**
 * 未知の文字列を ReasoningType に絞り込む。
 * LLM 出力・保存済みデータのどちらにも使うため、null / undefined 要素も許容する。
 *
 * `none` は「根拠の明示なし」なので他の根拠と同居しない。
 * `["professional_expertise", "none"]` のような矛盾した組み合わせをそのまま保存すると、
 * 「根拠なしの意見数」の集計が実態とズレるため、他の値があれば `none` を落とす。
 */
export function normalizeReasoningTypes(
  values: readonly (string | null | undefined)[] | null | undefined
): ReasoningType[] {
  if (!values) return [];
  const known = new Set<string>(REASONING_TYPES);
  const unique = [
    ...new Set(
      values.filter((v): v is ReasoningType => v != null && known.has(v))
    ),
  ];
  const grounded = unique.filter((v) => v !== "none");
  return grounded.length > 0 ? grounded : unique;
}
