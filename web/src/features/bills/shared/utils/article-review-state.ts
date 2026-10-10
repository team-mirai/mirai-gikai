import type { Bill } from "../types";

export type ArticleReviewState = "ai_generated" | "in_review" | "reviewed";

/**
 * 記事のレビュー状態を表示用に1つに決める。
 * AI自動生成版は人のレビューを経ていないため、is_review_completed より優先する。
 */
export function getArticleReviewState(
  bill: Pick<Bill, "article_kind" | "is_review_completed">
): ArticleReviewState {
  if (bill.article_kind === "ai_generated") return "ai_generated";
  return bill.is_review_completed ? "reviewed" : "in_review";
}
