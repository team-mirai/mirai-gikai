import { describe, expect, it } from "vitest";
import type { IntervieweeSatisfaction } from "../schemas";
import { computeOverallStats } from "./compute-overall-stats";

function mkSat(
  score: 1 | 2 | 3 | 4 | 5,
  coverage: IntervieweeSatisfaction["message_coverage"]
): IntervieweeSatisfaction {
  return {
    score,
    message_coverage: coverage,
    summary: "",
    uncovered_points: [],
  };
}

describe("computeOverallStats", () => {
  it("全て null は evaluatedCount=0、average=null", () => {
    const result = computeOverallStats([null, null, null]);
    expect(result.evaluatedCount).toBe(0);
    expect(result.averageScore).toBeNull();
    expect(result.coverage).toEqual({
      covered: 0,
      partial: 0,
      not_covered: 0,
    });
  });

  it("単一スロットの平均はそのスコア", () => {
    const result = computeOverallStats([mkSat(4, "covered")]);
    expect(result.evaluatedCount).toBe(1);
    expect(result.averageScore).toBe(4);
  });

  it("複数スロットの平均を四捨五入（小数第1位）で返す", () => {
    const result = computeOverallStats([
      mkSat(5, "covered"),
      mkSat(4, "covered"),
      mkSat(3, "partial"),
    ]);
    // (5+4+3)/3 = 4
    expect(result.averageScore).toBe(4);
    expect(result.coverage).toEqual({
      covered: 2,
      partial: 1,
      not_covered: 0,
    });
  });

  it("小数の平均は小数第1位まで丸める", () => {
    const result = computeOverallStats([
      mkSat(5, "covered"),
      mkSat(4, "covered"),
    ]);
    expect(result.averageScore).toBe(4.5);
  });

  it("null を混ぜても評価対象は非 null のみ", () => {
    const result = computeOverallStats([
      mkSat(3, "partial"),
      null,
      mkSat(1, "not_covered"),
    ]);
    expect(result.evaluatedCount).toBe(2);
    expect(result.averageScore).toBe(2);
    expect(result.coverage).toEqual({
      covered: 0,
      partial: 1,
      not_covered: 1,
    });
  });
});
