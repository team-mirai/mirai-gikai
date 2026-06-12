import { describe, expect, it } from "vitest";
import type { PublicOpinion } from "../types";
import { opinionAttributionLabel } from "./topic-category";

function makeOpinion(overrides: Partial<PublicOpinion> = {}): PublicOpinion {
  return {
    id: "o1",
    interview_report_id: "r1",
    report_public: true,
    created_at: null,
    title: "t",
    content: "c",
    user_category: "expert",
    role_title: null,
    bill_sentiment: null,
    contextual_quote: null,
    source_message_id: null,
    question_snippet: null,
    ...overrides,
  };
}

describe("opinionAttributionLabel", () => {
  it("role_title があればそれを使う", () => {
    expect(makeAttribution({ role_title: "育休経験者" })).toBe("育休経験者");
  });

  it("role_title が null ならカテゴリラベルにフォールバック", () => {
    expect(makeAttribution({ role_title: null, user_category: "expert" })).toBe(
      "専門家"
    );
  });

  it("role_title が空白のみならカテゴリラベルにフォールバック（'（）'防止）", () => {
    expect(
      makeAttribution({ role_title: "  ", user_category: "industry" })
    ).toBe("事業者");
  });

  function makeAttribution(overrides: Partial<PublicOpinion>) {
    return opinionAttributionLabel(makeOpinion(overrides));
  }
});
