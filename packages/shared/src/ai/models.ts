/**
 * AIモデルの識別子を一元管理する定数（Vercel AI Gateway形式）
 */
export const AI_MODELS = {
  // --- OpenAI ---
  gpt4o: "openai/gpt-4o",
  gpt4o_mini: "openai/gpt-4o-mini",
  gpt4_1: "openai/gpt-4.1",
  gpt4_1_mini: "openai/gpt-4.1-mini",
  gpt4_1_nano: "openai/gpt-4.1-nano",
  o3_mini: "openai/o3-mini",
  o4_mini: "openai/o4-mini",
  gpt5: "openai/gpt-5",
  gpt5_mini: "openai/gpt-5-mini",
  gpt5_nano: "openai/gpt-5-nano",
  gpt5_chat: "openai/gpt-5-chat",
  gpt5_1_instant: "openai/gpt-5.1-instant",
  gpt5_1_thinking: "openai/gpt-5.1-thinking",
  gpt5_2: "openai/gpt-5.2",
  // --- Google ---
  gemini3_flash: "google/gemini-3-flash",
  gemini3_1_pro_preview: "google/gemini-3.1-pro-preview",
  // --- Anthropic ---
  claude_haiku_4_5: "anthropic/claude-haiku-4.5",
  claude_sonnet_4_6: "anthropic/claude-sonnet-4.6",
  claude_opus_4_6: "anthropic/claude-opus-4.6",
} as const;

export type AiModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

/** インタビューチャットのデフォルトモデル */
export const DEFAULT_INTERVIEW_CHAT_MODEL = AI_MODELS.gpt5_2;
