import type { JudgeVerdict } from "../schemas";

export interface JudgeAggregateSummary {
  /** 合計スコア（current） */
  totalCurrent: number;
  /** 合計スコア（improved） */
  totalImproved: number;
  /** improved - current */
  diff: number;
  /** improved がリードした評価軸数 */
  improvedWinningCriteria: number;
  /** 同点だった評価軸数 */
  tiedCriteria: number;
  /** current がリードした評価軸数 */
  currentWinningCriteria: number;
  /** Judge が宣言した最終勝者 */
  winner: JudgeVerdict["winner"];
}

/**
 * Judge の verdict から、UI 上で表示する集計値を計算する純粋関数
 */
export function computeJudgeAggregate(
  verdict: JudgeVerdict
): JudgeAggregateSummary {
  let totalCurrent = 0;
  let totalImproved = 0;
  let improvedWinningCriteria = 0;
  let tiedCriteria = 0;
  let currentWinningCriteria = 0;

  for (const c of verdict.criteria) {
    totalCurrent += c.score_current;
    totalImproved += c.score_improved;
    if (c.score_improved > c.score_current) {
      improvedWinningCriteria += 1;
    } else if (c.score_improved < c.score_current) {
      currentWinningCriteria += 1;
    } else {
      tiedCriteria += 1;
    }
  }

  return {
    totalCurrent,
    totalImproved,
    diff: totalImproved - totalCurrent,
    improvedWinningCriteria,
    tiedCriteria,
    currentWinningCriteria,
    winner: verdict.winner,
  };
}

/**
 * 勝者バッジに表示する短いラベル
 */
export function formatWinnerLabel(winner: JudgeVerdict["winner"]): string {
  switch (winner) {
    case "improved":
      return "改善版が優位";
    case "current":
      return "現行が優位";
    case "tie":
      return "差は小さい";
  }
}
