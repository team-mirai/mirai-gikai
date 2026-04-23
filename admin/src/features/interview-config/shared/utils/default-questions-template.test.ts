import { describe, expect, it } from "vitest";
import {
  buildQuestionsFromTemplate,
  DEFAULT_QUESTIONS_TEMPLATE,
} from "./default-questions-template";

describe("DEFAULT_QUESTIONS_TEMPLATE", () => {
  it("contains exactly 6 entries", () => {
    expect(DEFAULT_QUESTIONS_TEMPLATE).toHaveLength(6);
  });

  it("has Q1 and Q4 as generated slots, others as fixed", () => {
    const kinds = DEFAULT_QUESTIONS_TEMPLATE.map((e) => e.kind);
    expect(kinds).toEqual([
      "generated",
      "fixed",
      "fixed",
      "generated",
      "fixed",
      "fixed",
    ]);
    const slots = DEFAULT_QUESTIONS_TEMPLATE.filter(
      (e) => e.kind === "generated"
    ).map((e) => (e.kind === "generated" ? e.slot : null));
    expect(slots).toEqual(["q1", "q4"]);
  });
});

describe("buildQuestionsFromTemplate", () => {
  it("uses samples when no LLM input is provided", () => {
    const result = buildQuestionsFromTemplate({});
    expect(result).toHaveLength(6);

    // Q1 falls back to sample
    expect(result[0].question).toBe(
      "この法案にどういう立場で関わっていますか。"
    );
    expect(result[0].quick_replies).toContain("一般市民として関心がある");

    // Q2 固定
    expect(result[1].question).toContain("ご存知");
    expect(result[1].quick_replies).toEqual([
      "よく知っている",
      "概要は知っている",
      "聞いたことはある",
      "ほとんど知らない",
    ]);

    // Q5, Q6 は quick_replies 無し
    expect(result[4].quick_replies).toBeUndefined();
    expect(result[5].quick_replies).toBeUndefined();
  });

  it("applies LLM-generated content for Q1 and Q4", () => {
    const result = buildQuestionsFromTemplate({
      q1: {
        question: "この教育法案にどういう立場で関わっていますか。",
        follow_up_guide: "教育現場での役割を具体化してください。",
        quick_replies: ["教員", "保護者", "学生", "教育行政", "その他"],
      },
      q4: {
        question: "この法案で特に気になっている点は？",
        follow_up_guide: "一つに絞って選んでください。",
        quick_replies: [
          "カリキュラム変更",
          "予算配分",
          "教員負担",
          "入試制度",
          "地域格差",
        ],
      },
    });

    expect(result[0].question).toBe(
      "この教育法案にどういう立場で関わっていますか。"
    );
    expect(result[0].quick_replies).toEqual([
      "教員",
      "保護者",
      "学生",
      "教育行政",
      "その他",
    ]);
    expect(result[3].quick_replies).toHaveLength(5);
  });

  it("falls back to sample when LLM input fields are empty strings", () => {
    const result = buildQuestionsFromTemplate({
      q1: { question: "   ", follow_up_guide: "", quick_replies: [] },
    });
    expect(result[0].question).toBe(
      "この法案にどういう立場で関わっていますか。"
    );
    // サンプル quick_replies にフォールバック
    expect(result[0].quick_replies?.length).toBeGreaterThan(0);
  });

  it("filters out empty quick_replies strings", () => {
    const result = buildQuestionsFromTemplate({
      q1: { quick_replies: ["a", "", "  ", "b"] },
    });
    expect(result[0].quick_replies).toEqual(["a", "b"]);
  });

  it("does not mutate the template quick_replies array", () => {
    const result = buildQuestionsFromTemplate({});
    result[1].quick_replies?.push("mutated");
    const result2 = buildQuestionsFromTemplate({});
    expect(result2[1].quick_replies).not.toContain("mutated");
  });
});
