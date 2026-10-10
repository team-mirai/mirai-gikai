import { Info } from "lucide-react";
import { ArticleReportForm } from "@/features/article-reports/client/components/article-report-form";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import type { ArticleReviewState } from "../../../shared/utils/article-review-state";
import { ReviewInProgressBanner } from "./review-status-banner";

/**
 * AI自動生成版の記事上部に表示するバナー
 */
export function AiGeneratedBanner({
  billId,
  difficultyLevel,
}: {
  billId: string;
  difficultyLevel: DifficultyLevelEnum;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-mirai-surface-grouped px-4 py-2.5">
      <div className="flex gap-1.5 items-start">
        <Info className="size-[15px] shrink-0 mt-[3px] text-mirai-text-muted" />
        <p className="text-[13px] font-medium leading-[1.6] text-mirai-text-note">
          この記事はAIが作成しており誤りを含む可能性があります。お気づきの点はご報告ください。
        </p>
      </div>
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
