import { MODERATION_THRESHOLDS } from "../moderation/moderation";

export const AUTO_PUBLISH_MAX_MODERATION_SCORE =
  MODERATION_THRESHOLDS.WARNING - 1;
export const AUTO_PUBLISH_MIN_CONTENT_RICHNESS = 50;
/**
 * オープンデータAPIが議案を配布対象に含める下限。
 *
 * かつては公開ページの表示ゲート（k-匿名性）としてサイト全体で使っていたが、
 * 「偏ったインタビューが悪目立ちする」懸念が実際には起きなかったため表示側からは
 * 撤去した。バルクエクスポートは第三者が他データと突き合わせられる経路で、
 * 表示するかどうかとは別の判断なのでこちらには残す。
 */
export const MIN_PUBLIC_REPORTS_FOR_OPEN_DATA = 20;

export type AutoPublishReportInput = {
  isPublicByUser: boolean;
  moderationScore: number | null;
  totalContentRichness: number | null;
};

export function isReportAutoPublishEligible({
  isPublicByUser,
  moderationScore,
  totalContentRichness,
}: AutoPublishReportInput): boolean {
  return (
    isPublicByUser &&
    moderationScore !== null &&
    moderationScore <= AUTO_PUBLISH_MAX_MODERATION_SCORE &&
    totalContentRichness !== null &&
    totalContentRichness >= AUTO_PUBLISH_MIN_CONTENT_RICHNESS
  );
}

export type UserSettingAutoPublishInput = AutoPublishReportInput & {
  isPublicByAdmin: boolean;
  adminUnpublishedAt: string | null;
};

/**
 * ユーザーの公開設定変更に伴って is_public_by_admin を引き上げてよいかを判定する。
 * 管理者が明示的に非公開にしたレポート（admin_unpublished_at あり）は、
 * 自動公開条件を満たしていてもユーザー操作では再公開しない。
 */
export function shouldAutoPublishOnUserSettingChange({
  isPublicByAdmin,
  adminUnpublishedAt,
  ...eligibility
}: UserSettingAutoPublishInput): boolean {
  return (
    !isPublicByAdmin &&
    adminUnpublishedAt === null &&
    isReportAutoPublishEligible(eligibility)
  );
}

export type PublicReportVisibilityInput = {
  isPublicByAdmin: boolean;
  isPublicByUser: boolean;
};

/**
 * 公開レポートを表示してよいか。
 *
 * 判定は管理者公開とユーザー同意の2つだけ。議案あたりの件数による下限
 * （20件の k-匿名性ゲート）は撤去した。少数回答の議案が悪目立ちする懸念で
 * 入れていたが、運用上そうした事象が起きていないため。
 */
export function isPublicReportVisible({
  isPublicByAdmin,
  isPublicByUser,
}: PublicReportVisibilityInput): boolean {
  return isPublicByAdmin && isPublicByUser;
}
