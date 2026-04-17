import type { IntervieweeSatisfaction } from "../schemas";

export interface OverallStats {
  /** 評価対象（満足度が付いたスロット）の数 */
  evaluatedCount: number;
  /** 平均スコア（1〜5）。評価対象が 0 件なら null */
  averageScore: number | null;
  /** coverage の内訳 */
  coverage: {
    covered: number;
    partial: number;
    not_covered: number;
  };
}

/**
 * 複数スロットの満足度配列から集計統計を計算する純粋関数。
 * LLM に頼らず即座に数値を出せるので、UI に先行表示する用途。
 */
export function computeOverallStats(
  satisfactions: Array<IntervieweeSatisfaction | null>
): OverallStats {
  const evaluated = satisfactions.filter(
    (s): s is IntervieweeSatisfaction => s !== null
  );
  if (evaluated.length === 0) {
    return {
      evaluatedCount: 0,
      averageScore: null,
      coverage: { covered: 0, partial: 0, not_covered: 0 },
    };
  }

  const sum = evaluated.reduce((acc, s) => acc + s.score, 0);
  const average = sum / evaluated.length;

  const coverage = { covered: 0, partial: 0, not_covered: 0 };
  for (const s of evaluated) {
    coverage[s.message_coverage] += 1;
  }

  return {
    evaluatedCount: evaluated.length,
    averageScore: Math.round(average * 10) / 10,
    coverage,
  };
}
