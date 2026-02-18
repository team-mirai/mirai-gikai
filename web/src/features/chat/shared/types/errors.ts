/**
 * チャット機能で使用するエラーコード
 */
export const ChatErrorCode = {
  DAILY_COST_LIMIT_REACHED: "DAILY_COST_LIMIT_REACHED",
  PROMPT_FETCH_FAILED: "PROMPT_FETCH_FAILED",
  LLM_GENERATION_FAILED: "LLM_GENERATION_FAILED",
} as const;

export type ChatErrorCode = (typeof ChatErrorCode)[keyof typeof ChatErrorCode];

/**
 * チャット機能のカスタムエラー
 */
export class ChatError extends Error {
  constructor(
    public readonly code: ChatErrorCode,
    message?: string
  ) {
    super(message || code);
    this.name = "ChatError";
  }
}
