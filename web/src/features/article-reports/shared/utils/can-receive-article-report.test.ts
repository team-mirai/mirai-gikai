import { describe, expect, it } from "vitest";
import { canReceiveArticleReport } from "./can-receive-article-report";

describe("canReceiveArticleReport", () => {
  it("公開中のAI自動生成版なら true", () => {
    expect(
      canReceiveArticleReport({
        publish_status: "published",
        article_kind: "ai_generated",
      })
    ).toBe(true);
  });

  it("通常版の記事は false", () => {
    expect(
      canReceiveArticleReport({
        publish_status: "published",
        article_kind: "standard",
      })
    ).toBe(false);
  });

  it("非公開の記事は false", () => {
    expect(
      canReceiveArticleReport({
        publish_status: "draft",
        article_kind: "ai_generated",
      })
    ).toBe(false);
    expect(
      canReceiveArticleReport({
        publish_status: "coming_soon",
        article_kind: "ai_generated",
      })
    ).toBe(false);
  });

  it("議案が存在しなければ false", () => {
    expect(canReceiveArticleReport(null)).toBe(false);
  });
});
