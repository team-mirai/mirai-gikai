import { describe, expect, it } from "vitest";
import type { QuestionAnswerCount } from "../types";
import { withAnswerBarPercents } from "./calc-answer-bar-percents";

function count(
  askedSessionCount: number,
  answeredSessionCount: number
): QuestionAnswerCount {
  return {
    questionId: "q",
    question: "質問",
    questionOrder: 1,
    askedSessionCount,
    answeredSessionCount,
  };
}

describe("withAnswerBarPercents", () => {
  it("全質問中の最大提示数を分母として回答数の割合を付与する", () => {
    // maxAsked = 10: 各行の asked ではなく全体の最大値で正規化する
    const result = withAnswerBarPercents([count(10, 8), count(4, 3)]);
    expect(result.map((r) => r.barPercent)).toEqual([80, 30]);
    // 元のフィールドは保持される
    expect(result[0]).toMatchObject(count(10, 8));
  });

  it("提示数が0でもゼロ除算しない", () => {
    expect(withAnswerBarPercents([count(0, 0)])[0].barPercent).toBe(0);
  });

  it("空配列は空配列を返す", () => {
    expect(withAnswerBarPercents([])).toEqual([]);
  });
});
