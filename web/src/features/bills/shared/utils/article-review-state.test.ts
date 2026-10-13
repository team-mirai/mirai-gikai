import { describe, expect, it } from "vitest";
import { getArticleReviewState } from "./article-review-state";

describe("getArticleReviewState", () => {
  it("通常版でレビュー完了なら reviewed", () => {
    expect(
      getArticleReviewState({
        article_kind: "standard",
        is_review_completed: true,
      })
    ).toBe("reviewed");
  });

  it("通常版でレビュー未完了なら in_review", () => {
    expect(
      getArticleReviewState({
        article_kind: "standard",
        is_review_completed: false,
      })
    ).toBe("in_review");
  });

  it("AI自動生成版はレビュー完了フラグに関わらず ai_generated", () => {
    expect(
      getArticleReviewState({
        article_kind: "ai_generated",
        is_review_completed: false,
      })
    ).toBe("ai_generated");
    expect(
      getArticleReviewState({
        article_kind: "ai_generated",
        is_review_completed: true,
      })
    ).toBe("ai_generated");
  });
});
