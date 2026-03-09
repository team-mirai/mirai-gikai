/**
 * suggest_interviewツールの名前（サーバー側ツール定義用）
 */
export const SUGGEST_INTERVIEW_TOOL_NAME = "suggest_interview";

/**
 * suggest_interviewツールのUIメッセージpart type（クライアント側判定用）
 */
export const SUGGEST_INTERVIEW_TOOL_TYPE =
  `tool-${SUGGEST_INTERVIEW_TOOL_NAME}` as const;
