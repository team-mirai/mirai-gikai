import { describe, expect, it } from "vitest";
import type { PublicOpinion } from "../types";
import { normalizeRoleTitle, opinionAttributionLabel } from "./topic-category";

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
    richness: null,
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

  it("汎用的な「一般市民」等の肩書はカテゴリラベル（市民）にフォールバック", () => {
    expect(
      makeAttribution({ role_title: "一般市民", user_category: "citizen" })
    ).toBe("市民");
  });

  function makeAttribution(overrides: Partial<PublicOpinion>) {
    return opinionAttributionLabel(makeOpinion(overrides));
  }
});

describe("normalizeRoleTitle", () => {
  it("固有の肩書はそのまま返す", () => {
    expect(normalizeRoleTitle("育休経験者")).toBe("育休経験者");
  });
  it("null・空白は null", () => {
    expect(normalizeRoleTitle(null)).toBeNull();
    expect(normalizeRoleTitle("  ")).toBeNull();
  });
  it("汎用的な「市民」相当（一般市民/市民/一般）は null", () => {
    expect(normalizeRoleTitle("一般市民")).toBeNull();
    expect(normalizeRoleTitle("市民")).toBeNull();
    expect(normalizeRoleTitle("一般")).toBeNull();
  });
});
