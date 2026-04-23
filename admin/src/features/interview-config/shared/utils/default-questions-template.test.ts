import { describe, expect, it } from "vitest";
import {
  buildQuestionsFromTemplate,
  DEFAULT_QUESTIONS_TEMPLATE,
} from "./default-questions-template";

describe("DEFAULT_QUESTIONS_TEMPLATE", () => {
  it("contains exactly 7 entries", () => {
    expect(DEFAULT_QUESTIONS_TEMPLATE).toHaveLength(7);
  });

  it("has Q1/Q2 as generated slots, others as fixed", () => {
    const kinds = DEFAULT_QUESTIONS_TEMPLATE.map((e) => e.kind);
    expect(kinds).toEqual([
      "generated",
      "generated",
      "fixed",
      "fixed",
      "fixed",
      "fixed",
      "fixed",
    ]);
    const slots = DEFAULT_QUESTIONS_TEMPLATE.filter(
      (e) => e.kind === "generated"
    ).map((e) => (e.kind === "generated" ? e.slot : null));
    expect(slots).toEqual(["q1", "q2"]);
  });
});

describe("buildQuestionsFromTemplate", () => {
  it("uses samples when no LLM input is provided", () => {
    const result = buildQuestionsFromTemplate({});
    expect(result).toHaveLength(7);

    // Q1 サンプル（テーマ選択）
    expect(result[0].question).toContain("テーマを選んでください");
    expect(result[0].quick_replies?.length).toBeGreaterThan(0);

    // Q2 サンプル（立場・関わり方）
    expect(result[1].question).toContain("立場");
    expect(result[1].quick_replies).toContain("一般市民として関心がある");

    // Q3 固定: 認知度
    expect(result[2].question).toContain("ご存知");
    expect(result[2].quick_replies).toEqual([
      "よく知っている",
      "概要は知っている",
      "聞いたことはある",
      "ほとんど知らない",
    ]);

    // Q5, Q6, Q7 は quick_replies 無し
    expect(result[4].quick_replies).toBeUndefined();
    expect(result[5].quick_replies).toBeUndefined();
    expect(result[6].quick_replies).toBeUndefined();
  });

  it("applies LLM-generated content for Q1 and Q2", () => {
    const result = buildQuestionsFromTemplate({
      q1: {
        question: "この教育法案で関心のあるテーマを選んでください。",
        follow_up_guide: "次の質問で深掘りします。",
        quick_replies: [
          "カリキュラム変更",
          "予算配分",
          "教員負担",
          "入試制度",
          "地域格差",
        ],
      },
      q2: {
        question: "この教育法案における立場を教えてください。",
        follow_up_guide: "教育現場での役割を具体化してください。",
        quick_replies: ["教員", "保護者", "学生", "教育行政", "その他"],
      },
    });

    expect(result[0].question).toBe(
      "この教育法案で関心のあるテーマを選んでください。"
    );
    expect(result[0].quick_replies).toHaveLength(5);
    expect(result[1].question).toBe(
      "この教育法案における立場を教えてください。"
    );
    expect(result[1].quick_replies).toEqual([
      "教員",
      "保護者",
      "学生",
      "教育行政",
      "その他",
    ]);
  });

  it("falls back to sample when LLM input fields are empty strings", () => {
    const result = buildQuestionsFromTemplate({
      q1: { question: "   ", follow_up_guide: "", quick_replies: [] },
    });
    expect(result[0].question).toContain("テーマを選んでください");
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
    result[2].quick_replies?.push("mutated");
    const result2 = buildQuestionsFromTemplate({});
    expect(result2[2].quick_replies).not.toContain("mutated");
  });
});
