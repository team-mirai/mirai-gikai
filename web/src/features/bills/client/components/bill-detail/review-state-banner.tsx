import { ArticleReportForm } from "@/features/article-reports/client/components/article-report-form";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import type { ArticleReviewState } from "../../../shared/utils/article-review-state";
import { ReviewInProgressBanner } from "./review-status-banner";

/**
 * AI自動生成版の記事上部に表示するバナー
 */
function AiGeneratedBanner({
  billId,
  difficultyLevel,
}: {
  billId: string;
  difficultyLevel: DifficultyLevelEnum;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-mirai-surface-gray px-4 py-2.5">
      <ArticleReportForm billId={billId} difficultyLevel={difficultyLevel} />
    </div>
  );
}

/**
 * 記事のレビュー状態に応じたバナー。レビュー済みの記事には何も出さない
 */
export function ReviewStateBanner({
  state,
  billId,
  difficultyLevel,
}: {
  state: ArticleReviewState;
  billId: string;
  difficultyLevel: DifficultyLevelEnum;
}) {
  if (state === "in_review") return <ReviewInProgressBanner />;
  if (state === "ai_generated")
    return (
      <AiGeneratedBanner billId={billId} difficultyLevel={difficultyLevel} />
    );
  return null;
}
