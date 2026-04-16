import type { NextQuestionInput } from "./types";

export { buildLoopModeSystemPrompt } from "@mirai-gikai/shared/interview-prompts/loop-mode";

/**
 * Loop Mode: 次の質問を強制しない（LLMに任せる）
 *
 * 常に undefined を返す
 */
export function calculateLoopModeNextQuestionId(
  _params: NextQuestionInput
): undefined {
  return undefined;
}
