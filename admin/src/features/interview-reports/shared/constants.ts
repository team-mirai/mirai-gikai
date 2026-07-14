import { formatRoleLabel as formatRoleLabelPure } from "./utils/format-role-label";

/**
 * インタビューレポートの役割の型
 */
export const interviewReportRoles = [
  "subject_expert",
  "work_related",
  "daily_life_affected",
  "general_citizen",
] as const;

export type InterviewReportRole = (typeof interviewReportRoles)[number];

/**
 * 役割のラベルマッピング
 */
export const roleLabels: Record<InterviewReportRole, string> = {
  subject_expert: "専門的な有識者",
  work_related: "業務に関係",
  daily_life_affected: "暮らしに影響",
  general_citizen: "一般的な関心",
};

/**
 * インタビューレポートで扱うスタンス
 * （stance_type_enum のうち free_vote はレポートでは使用しないため除外）
 */
export const interviewReportStances = [
  "for",
  "against",
  "neutral",
  "conditional_for",
  "conditional_against",
  "considering",
  "continued_deliberation",
] as const;

export type InterviewReportStance = (typeof interviewReportStances)[number];

/**
 * スタンスのラベルマッピング
 */
export const stanceLabels: Record<InterviewReportStance, string> = {
  for: "賛成",
  against: "反対",
  neutral: "中立",
  conditional_for: "条件付き賛成",
  conditional_against: "条件付き反対",
  considering: "検討中",
  continued_deliberation: "継続審議",
};

const ALL_OPTION = { value: "all", label: "すべて" } as const;

/**
 * 役割フィルタの選択肢（セッション一覧・発言検索で共用）
 */
export const ROLE_FILTER_OPTIONS: readonly {
  value: string;
  label: string;
}[] = [
  ALL_OPTION,
  ...interviewReportRoles.map((role) => ({
    value: role,
    label: roleLabels[role],
  })),
];

/**
 * 発言検索のスタンスフィルタの選択肢（全スタンス対象）
 */
export const MESSAGE_SEARCH_STANCE_FILTER_OPTIONS: readonly {
  value: string;
  label: string;
}[] = [
  ALL_OPTION,
  ...interviewReportStances.map((stance) => ({
    value: stance,
    label: stanceLabels[stance],
  })),
];

/**
 * 役割ラベルとrole_titleを中黒で結合して表示用文字列を生成
 * 例：「専門家・物流業者」
 */
export function formatRoleLabel(
  role?: string | null,
  roleTitle?: string | null
): string | null {
  return formatRoleLabelPure(role, roleTitle, roleLabels);
}
