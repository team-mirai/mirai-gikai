import {
  calculateUsageCostUsd,
  roundCost,
  type SanitizedUsage,
} from "@/lib/ai/calculate-ai-cost";

/**
 * cost_usdカラムの値を安全にパースする
 */
export function parseCost(row: { cost_usd: number | null }): number {
  const value = Number(row.cost_usd);
  return Number.isFinite(value) ? value : 0;
}

/**
 * override > calculated > default の3段階フォールバックでコストを決定する
 */
export function resolveCostUsd(
  model: string,
  usage: SanitizedUsage,
  costOverride?: number | null
): number {
  if (typeof costOverride === "number" && Number.isFinite(costOverride)) {
    return roundCost(costOverride);
  }

  if (usage.inputTokens > 0 || usage.outputTokens > 0) {
    try {
      return calculateUsageCostUsd(model, usage);
    } catch (error) {
      console.error("Failed to calculate usage cost:", error);
    }
  }

  return 0;
}
