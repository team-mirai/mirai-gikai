import { SUGGEST_INTERVIEW_TOOL_TYPE } from "@/features/chat/shared/constants";

/**
 * インタビュー案内カードを表示するか判定する。
 * ツール呼び出しがテキストより先に来ても、返答の描画が終わってから表示する。
 */
export function shouldShowInterviewSuggestion(
  parts: Array<{ type: string }>,
  isStreaming: boolean
): boolean {
  return (
    !isStreaming &&
    parts.some((part) => part.type === SUGGEST_INTERVIEW_TOOL_TYPE)
  );
}
