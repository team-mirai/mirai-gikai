import { collectAskedQuestionIds } from "../../collect-asked-question-ids";
import type { NextQuestionInput } from "./types";

export { buildBulkModeSystemPrompt } from "@mirai-gikai/shared/interview-prompts/bulk-mode";

/**
 * Bulk Mode: 次に聞くべき質問IDを算出する純粋関数
 *
 * 未回答の質問のうち最初のものを返す
 */
export function calculateBulkModeNextQuestionId(
  params: NextQuestionInput
): string | undefined {
  const { messages, questions } = params;
  const askedQuestionIds = collectAskedQuestionIds(messages);
  const nextUnasked = questions.find((q) => !askedQuestionIds.has(q.id));
  return nextUnasked?.id;
}
