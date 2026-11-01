/**
 * AI Gateway の providerMetadata からコスト(USD)を取り出す。
 * 取得できない場合は undefined を返す。
 */
function extractStepGatewayCost(providerMetadata: unknown): number | undefined {
  if (!providerMetadata || typeof providerMetadata !== "object") {
    return undefined;
  }

  const gatewayCost = (
    providerMetadata as {
      gateway?: { cost?: unknown };
    }
  ).gateway?.cost;

  const numericCost = Number(gatewayCost);

  return Number.isFinite(numericCost) ? numericCost : undefined;
}

/**
 * 全ステップの AI Gateway コストを合算する。
 * マルチステップ応答では providerMetadata がステップ毎に分かれるため、
 * 最終ステップだけでなく全ステップ分を集計する。
 * どのステップからもコストが取得できない場合は undefined を返す。
 */
export function extractGatewayCost(
  steps: Array<{ providerMetadata?: unknown }>
): number | undefined {
  const costs = steps
    .map((step) => extractStepGatewayCost(step.providerMetadata))
    .filter((cost): cost is number => cost !== undefined);

  return costs.length > 0
    ? costs.reduce((sum, cost) => sum + cost, 0)
    : undefined;
}
