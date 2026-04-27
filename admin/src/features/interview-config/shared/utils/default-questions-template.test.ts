import { describe, expect, it } from "vitest";
import {
  buildQuestionsFromTemplate,
  DEFAULT_QUESTIONS_TEMPLATE,
  FOLLOW_UP_DEPTH_LIMIT_RULE,
  OTHER_FREE_TEXT_OPTION,
} from "./default-questions-template";

describe("DEFAULT_QUESTIONS_TEMPLATE", () => {
  it("contains exactly 7 entries", () => {
    expect(DEFAULT_QUESTIONS_TEMPLATE).toHaveLength(7);
  });

  it("has Q1/Q2 as quick_replies_slot, others as fixed", () => {
    const kinds = DEFAULT_QUESTIONS_TEMPLATE.map((e) => e.kind);
    expect(kinds).toEqual([
      "quick_replies_slot",
      "quick_replies_slot",
      "fixed",
      "fixed",
      "fixed",
      "fixed",
      "fixed",
    ]);
    const slots = DEFAULT_QUESTIONS_TEMPLATE.filter(
      (e) => e.kind === "quick_replies_slot"
    ).map((e) => (e.kind === "quick_replies_slot" ? e.slot : null));
    expect(slots).toEqual(["topics", "stance"]);
  });

  it("Q4/Q5/Q7 のフォローアップ指針に3往復ルールが含まれる", () => {
    // index 3=Q4(評価), 4=Q5(具体化), 6=Q7(設計者へ)
    for (const i of [3, 4, 6]) {
      expect(DEFAULT_QUESTIONS_TEMPLATE[i].follow_up_guide).toContain(
        FOLLOW_UP_DEPTH_LIMIT_RULE
      );
    }
  });

  it("Q6 は運用ハードルを問う質問で、5往復まで許容する独自ルールを持つ", () => {
    const q6 = DEFAULT_QUESTIONS_TEMPLATE[5];
    expect(q6.kind).toBe("fixed");
    expect(q6.question).toContain("法案");
    expect(q6.question).toContain("ハードル");
    expect(q6.question).toContain("個人・事業者・組織");
    expect(q6.follow_up_guide).toContain("最大5往復");
    if (q6.kind === "fixed") {
      expect(q6.quick_replies).toEqual([
        "はい（十分考慮されている／ハードルは小さい）",
        "いいえ（考慮が不十分／ハードルが大きい）",
        "わからない",
      ]);
    }
  });
});

describe("buildQuestionsFromTemplate", () => {
  it("uses sample quick_replies when no LLM input is provided", () => {
    const result = buildQuestionsFromTemplate({});
    expect(result).toHaveLength(7);

    // Q1: 固定質問 + サンプル選択肢 + 「その他（自由記述）」
    expect(result[0].question).toContain("テーマを選んでください");
    expect(result[0].quick_replies?.at(-1)).toBe(OTHER_FREE_TEXT_OPTION);

    // Q2: 固定質問 + サンプル選択肢 + 「その他（自由記述）」
    expect(result[1].question).toContain("立場");
    expect(result[1].quick_replies?.at(-1)).toBe(OTHER_FREE_TEXT_OPTION);

    // Q3 固定: 認知度
    expect(result[2].quick_replies).toEqual([
      "よく知っている",
      "概要は知っている",
      "聞いたことはある",
      "ほとんど知らない",
    ]);

    // Q5, Q7 は quick_replies 無し、Q6 は「はい／いいえ／わからない」
    expect(result[4].quick_replies).toBeUndefined();
    expect(result[5].quick_replies).toHaveLength(3);
    expect(result[6].quick_replies).toBeUndefined();
  });

  it("applies LLM-generated quick_replies and appends その他", () => {
    const result = buildQuestionsFromTemplate({
      topics: [
        "カリキュラム変更",
        "予算配分",
        "教員負担",
        "入試制度",
        "地域格差",
      ],
      stance: ["教員", "保護者", "学生", "教育行政", "その他業界関係者"],
    });

    expect(result[0].quick_replies).toEqual([
      "カリキュラム変更",
      "予算配分",
      "教員負担",
      "入試制度",
      "地域格差",
      OTHER_FREE_TEXT_OPTION,
    ]);
    expect(result[1].quick_replies).toEqual([
      "教員",
      "保護者",
      "学生",
      "教育行政",
      "その他業界関係者",
      OTHER_FREE_TEXT_OPTION,
    ]);
  });

  it("deduplicates and drops 「その他（自由記述）」 from LLM input", () => {
    const result = buildQuestionsFromTemplate({
      topics: ["A", OTHER_FREE_TEXT_OPTION, "B"],
    });
    // LLM が その他 を含めてもコード側で正規化され末尾に 1 回だけ付く
    expect(result[0].quick_replies).toEqual(["A", "B", OTHER_FREE_TEXT_OPTION]);
  });

  it("falls back to sample when LLM provides empty array", () => {
    const result = buildQuestionsFromTemplate({ topics: [] });
    expect(result[0].quick_replies?.length).toBeGreaterThan(1);
    expect(result[0].quick_replies?.at(-1)).toBe(OTHER_FREE_TEXT_OPTION);
  });

  it("falls back to sample when LLM returns only OTHER_FREE_TEXT_OPTION", () => {
    const result = buildQuestionsFromTemplate({
      topics: [OTHER_FREE_TEXT_OPTION],
    });
    // 「その他」しか返らなかった場合、選択肢が1件にならないようサンプルにフォールバック
    expect(result[0].quick_replies?.length).toBeGreaterThan(1);
    expect(result[0].quick_replies?.at(-1)).toBe(OTHER_FREE_TEXT_OPTION);
  });

  it("falls back to sample when LLM returns only blank strings", () => {
    const result = buildQuestionsFromTemplate({
      topics: ["   ", "", OTHER_FREE_TEXT_OPTION],
    });
    expect(result[0].quick_replies?.length).toBeGreaterThan(1);
    expect(result[0].quick_replies?.at(-1)).toBe(OTHER_FREE_TEXT_OPTION);
  });

  it("does not mutate the template quick_replies array", () => {
    const result = buildQuestionsFromTemplate({});
    result[2].quick_replies?.push("mutated");
    const result2 = buildQuestionsFromTemplate({});
    expect(result2[2].quick_replies).not.toContain("mutated");
  });

  it("Q1/Q2 の question と follow_up_guide は固定の文言を返す", () => {
    const result = buildQuestionsFromTemplate({
      topics: ["x", "y"],
      stance: ["a", "b"],
    });
    // 固定質問文
    expect(result[0].question).toBe(
      "今回の法改正のうち、あなたが特に関係がある、または意見を伝えたいテーマを選んでください。"
    );
    expect(result[1].question).toBe(
      "この法案について、あなたはどんな立場・関わり方に近いですか？"
    );
    // 固定フォローアップ指針の特徴文言
    expect(result[0].follow_up_guide).toContain("Q2に進む");
    expect(result[1].follow_up_guide).toContain("専門知識レベル");
  });
});
