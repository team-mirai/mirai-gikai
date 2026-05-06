import { MODERATION_THRESHOLDS } from "../moderation/moderation";

export const AUTO_PUBLISH_MAX_MODERATION_SCORE =
  MODERATION_THRESHOLDS.WARNING - 1;
export const AUTO_PUBLISH_MIN_CONTENT_RICHNESS = 50;
export const MIN_PUBLIC_REPORTS_FOR_DISPLAY = 20;

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

export function shouldDisplayPublicReports(publicReportCount: number): boolean {
  return publicReportCount >= MIN_PUBLIC_REPORTS_FOR_DISPLAY;
}

export type PublicReportVisibilityInput = {
  isPublicByAdmin: boolean;
  isPublicByUser: boolean;
  publicReportCount: number;
};

export function isPublicReportVisible({
  isPublicByAdmin,
  isPublicByUser,
  publicReportCount,
}: PublicReportVisibilityInput): boolean {
  return (
    isPublicByAdmin &&
    isPublicByUser &&
    shouldDisplayPublicReports(publicReportCount)
  );
}
