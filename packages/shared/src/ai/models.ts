/**
 * AIモデルの識別子を一元管理する定数
 */
export const AI_MODELS = {
  /**
   * GPT-4o: 高性能モデル
   * Input: $2.50 / 1M tokens
   * Output: $10.00 / 1M tokens
   */
  gpt4o: "openai/gpt-4o",
  /**
   * GPT-4o-mini: 高速・低コストモデル
   * Input: $0.15 / 1M tokens
   * Output: $0.60 / 1M tokens
   */
  gpt4o_mini: "openai/gpt-4o-mini",
  /**
   * Gemini 3 Flash: 高速・高コンテキストモデル
   * Input: $0.50 / 1M tokens
   * Output: $3.00 / 1M tokens
   */
  gemini3_flash: "google/gemini-3-flash",
} as const;

export type AiModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];
