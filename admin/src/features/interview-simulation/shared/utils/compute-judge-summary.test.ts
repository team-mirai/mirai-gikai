import { describe, expect, it } from "vitest";
import type { JudgeVerdict } from "../schemas";
import {
  computeJudgeAggregate,
  formatWinnerLabel,
} from "./compute-judge-summary";

function makeVerdict(
  scores: Array<[number, number]>,
  winner: JudgeVerdict["winner"] = "improved"
): JudgeVerdict {
  return {
    criteria: scores.map(([cur, imp], i) => ({
      criterion: (
        [
          "question_diversity",
          "depth_of_followup",
          "flow_naturalness",
          "question_coverage",
          "persona_consistency",
        ] as const
      )[i % 5],
      score_current: cur,
      score_improved: imp,
      comment: "x",
    })),
    winner,
    summary: "x",
    key_differences: [],
    concerns: [],
  };
}

describe("computeJudgeAggregate", () => {
  it("合計スコアと差分が計算される", () => {
    const verdict = makeVerdict([
      [3, 5],
      [4, 4],
      [2, 4],
    ]);
    const agg = computeJudgeAggregate(verdict);
    expect(agg.totalCurrent).toBe(9);
    expect(agg.totalImproved).toBe(13);
    expect(agg.diff).toBe(4);
  });

  it("勝ち負けの集計が正しい", () => {
    const verdict = makeVerdict([
      [3, 5], // improved win
      [4, 4], // tie
      [5, 3], // current win
      [2, 4], // improved win
    ]);
    const agg = computeJudgeAggregate(verdict);
    expect(agg.improvedWinningCriteria).toBe(2);
    expect(agg.tiedCriteria).toBe(1);
    expect(agg.currentWinningCriteria).toBe(1);
  });

  it("空 criteria でも 0 で返る", () => {
    const verdict = makeVerdict([], "tie");
    const agg = computeJudgeAggregate(verdict);
    expect(agg.totalCurrent).toBe(0);
    expect(agg.totalImproved).toBe(0);
    expect(agg.diff).toBe(0);
    expect(agg.improvedWinningCriteria).toBe(0);
    expect(agg.winner).toBe("tie");
  });
});

describe("formatWinnerLabel", () => {
  it("各勝者のラベルが返る", () => {
    expect(formatWinnerLabel("improved")).toBe("改善版が優位");
    expect(formatWinnerLabel("current")).toBe("現行が優位");
    expect(formatWinnerLabel("tie")).toBe("差は小さい");
  });
});
