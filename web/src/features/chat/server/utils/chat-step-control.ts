import { SUGGEST_INTERVIEW_TOOL_NAME } from "@/features/chat/shared/constants";

/**
 * チャット応答の最大ステップ数。
 * suggest_interview だけを呼んでテキストを返さなかった場合に、
 * ツール結果を受けてテキスト応答を生成する2ステップ目を許可する。
 */
export const CHAT_MAX_STEPS = 2;

type StepLike = {
  text: string;
  toolCalls: Array<{ toolName: string }>;
};

/**
 * 直前のステップでテキスト応答が生成済みなら、追加ステップは不要と判定する。
 * （テキストと同時にツールを呼んだ場合に、重複したテキストが続かないようにする）
 */
export function hasTextInLastStep({ steps }: { steps: StepLike[] }): boolean {
  return Boolean(steps.at(-1)?.text.trim());
}

/**
 * suggest_interview が既に呼ばれていれば、以降のステップで使えるツールから除外する。
 * 追加ステップで再びツールだけを呼ばず、テキスト応答を書かせるため。
 */
export function selectActiveChatTools(
  toolNames: string[],
  steps: StepLike[]
): string[] {
  const alreadySuggested = steps.some((step) =>
    step.toolCalls.some((call) => call.toolName === SUGGEST_INTERVIEW_TOOL_NAME)
  );
  return alreadySuggested
    ? toolNames.filter((name) => name !== SUGGEST_INTERVIEW_TOOL_NAME)
    : toolNames;
}
