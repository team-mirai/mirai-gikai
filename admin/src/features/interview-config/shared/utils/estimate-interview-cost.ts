/**
 * 1インタビューあたりの推定コスト算出
 *
 * 推定前提（実測ベース: GPT-5.1 Instant / 15ターン）:
 * - 1インタビューあたり入力トークン: 約85,000（システムプロンプト + 履歴の累積）
 * - 1インタビューあたり出力トークン: 約3,000（AI応答の合計）
 */

type ModelPricing = {
  inputPerMillion: number;
  outputPerMillion: number;
};

/** 1インタビューあたりの推定トークン使用量 */
const ESTIMATED_INPUT_TOKENS = 85_000;
const ESTIMATED_OUTPUT_TOKENS = 3_000;

/**
 * モデルごとの料金（USD / 1Mトークン）
 * web/src/lib/ai/calculate-ai-cost.ts の modelPricing と同じ値
 */
const MODEL_PRICING: Record<string, ModelPricing> = {
  // --- OpenAI ---
  "openai/gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  "openai/gpt-5": { inputPerMillion: 1.25, outputPerMillion: 10 },
  "openai/gpt-5-mini": { inputPerMillion: 0.25, outputPerMillion: 2 },
  "openai/gpt-5-nano": { inputPerMillion: 0.05, outputPerMillion: 0.4 },
  "openai/gpt-5-chat": { inputPerMillion: 1.25, outputPerMillion: 10 },
  "openai/gpt-5.1-instant": { inputPerMillion: 1.25, outputPerMillion: 10 },
  "openai/gpt-5.1-thinking": { inputPerMillion: 1.25, outputPerMillion: 10 },
  "openai/gpt-5.2": { inputPerMillion: 1.75, outputPerMillion: 14 },
  // --- Google ---
  "google/gemini-3-flash": { inputPerMillion: 0.5, outputPerMillion: 3 },
  "google/gemini-3.1-pro-preview": {
    inputPerMillion: 2,
    outputPerMillion: 12,
  },
  // --- Anthropic ---
  "anthropic/claude-haiku-4.5": { inputPerMillion: 1, outputPerMillion: 5 },
  "anthropic/claude-sonnet-4.6": { inputPerMillion: 3, outputPerMillion: 15 },
  "anthropic/claude-opus-4.6": { inputPerMillion: 5, outputPerMillion: 25 },
};

/**
 * モデルIDから1インタビューあたりの推定コスト（USD）を算出する
 * @returns 推定コスト（USD）。不明なモデルの場合は null
 */
export function estimateInterviewCostUsd(modelId: string): number | null {
  const pricing = MODEL_PRICING[modelId];
  if (!pricing) return null;

  const inputCost =
    (pricing.inputPerMillion * ESTIMATED_INPUT_TOKENS) / 1_000_000;
  const outputCost =
    (pricing.outputPerMillion * ESTIMATED_OUTPUT_TOKENS) / 1_000_000;

  return inputCost + outputCost;
}

/** USD→JPY換算レート */
const USD_TO_JPY = 150;

/**
 * 推定コストを日本円の表示用文字列にフォーマットする
 * 例: "~2円", "~21円", "~75円"
 */
export function formatEstimatedCost(costUsd: number): string {
  const yen = Math.round(costUsd * USD_TO_JPY);
  if (yen < 1) {
    return "~1円";
  }
  return `~${yen}円`;
}
