import type { LucideIcon } from "lucide-react";
import { Briefcase, GraduationCap, Home, User } from "lucide-react";

/**
 * スタンスのラベルマッピング
 */
export const stanceLabels: Record<string, string> = {
  for: "期待している",
  against: "懸念している",
  neutral: "期待と懸念両方がある",
};

/**
 * スタンスのテキストカラーマッピング（Tailwind CSS クラス）
 */
export const stanceTextColors: Record<string, string> = {
  for: "text-primary-accent",
  against: "text-stance-against-light",
  neutral: "text-stance-neutral",
};

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
 * 役割のアイコンマッピング
 */
export const roleIcons: Record<InterviewReportRole, LucideIcon> = {
  subject_expert: GraduationCap,
  work_related: Briefcase,
  daily_life_affected: Home,
  general_citizen: User,
};

/**
 * 役割ラベルとrole_titleを中黒で結合して表示用文字列を生成
 * 例：「専門家・物流業者」
 */
export function formatRoleLabel(
  role?: string | null,
  roleTitle?: string | null
): string | null {
  const baseLabel = role
    ? roleLabels[role as InterviewReportRole] || role
    : null;
  if (baseLabel && roleTitle) {
    return `${baseLabel}・${roleTitle}`;
  }
  return roleTitle || baseLabel;
}
