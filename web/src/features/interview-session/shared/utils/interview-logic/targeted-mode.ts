import type { NextQuestionInput } from "./types";

export { buildTargetedModeSystemPrompt } from "@mirai-gikai/shared/interview-prompts/targeted-mode";

/**
 * Targeted Mode: 次の質問を強制しない（LLMに任せる）
 *
 * Loop Mode と同様、対象者条件によるスキップ判定や深掘りの判断は
 * すべて LLM に委ねるため常に undefined を返す。
 */
export function calculateTargetedModeNextQuestionId(
  _params: NextQuestionInput
): undefined {
  return undefined;
}
