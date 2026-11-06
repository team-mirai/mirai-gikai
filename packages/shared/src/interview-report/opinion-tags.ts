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

export const REASONING_TYPE_LABELS: Record<ReasoningType, string> = {
  personal_experience: "個人体験",
  family_observation: "家族・身近な人の観察",
  professional_expertise: "専門知識",
  research_reference: "研究引用",
  overseas_example: "海外事例",
  intuition: "直感",
  none: "根拠なし",
};

/**
 * 分析対象の絞り込み。
 * - all: 絞り込まない
 * - experts: 一般市民を除く（当事者・業界関係者・専門家）
 * - specialists: 専門知識を根拠にした意見のみ
 *
 * specialists は experts の部分集合ではない。肩書が一般市民でも職業上の知見を
 * 根拠にした発言は specialists に入る。段階的な絞り込みではなく別の切り口。
 */
export const OPINION_AUDIENCES = ["all", "experts", "specialists"] as const;

export type OpinionAudience = (typeof OPINION_AUDIENCES)[number];

export const OPINION_AUDIENCE_LABELS: Record<OpinionAudience, string> = {
  all: "全体",
  experts: "有識者・当事者",
  specialists: "専門家",
};

/** experts が許容する role（general_citizen を除く3区分）。 */
const EXPERT_ROLES = new Set([
  "daily_life_affected",
  "work_related",
  "subject_expert",
]);

/** 文字列を OpinionAudience に絞り込む（URL パラメータ等の検証用）。 */
export function isOpinionAudience(value: unknown): value is OpinionAudience {
  return (
    typeof value === "string" &&
    (OPINION_AUDIENCES as readonly string[]).includes(value)
  );
}

/** 意見1件が指定 audience に含まれるかを判定する純粋関数。 */
export function opinionPassesAudience(
  audience: OpinionAudience,
  opinion: { role: string | null; reasoning_types: readonly string[] | null }
): boolean {
  if (audience === "all") return true;

  const { role, reasoning_types } = opinion;
  if (audience === "experts") {
    return role != null && EXPERT_ROLES.has(role);
  }

  // specialists: 肩書が専門家 か、発言が専門知識を根拠にしている。
  // role 単独では本番実測で全意見の1%未満しか拾えないため後者が本体。
  return (
    role === "subject_expert" ||
    (reasoning_types?.includes("professional_expertise") ?? false)
  );
}
