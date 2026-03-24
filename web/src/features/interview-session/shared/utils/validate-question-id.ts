import { collectUsedQuestionIds } from "./collect-used-question-ids";

/**
 * LLMが返した question_id / quick_replies を検証し、
 * 既出の question_id であれば両方を無効化する純粋関数
 *
 * 深掘り質問で前の事前定義質問の question_id を引きずるケースを防止する
 */
export function validateQuestionId({
  questionId,
  quickReplies,
  previousMessages,
}: {
  questionId: string | null;
  quickReplies: string[];
  previousMessages: Array<{ role: string; questionId?: string | null }>;
}): {
  questionId: string | null;
  quickReplies: string[];
} {
  if (!questionId || questionId.trim().length === 0) {
    return { questionId: null, quickReplies };
  }

  const usedQuestionIds = collectUsedQuestionIds(previousMessages);
  if (usedQuestionIds.has(questionId)) {
    // 既出IDの場合は quick_replies も引きずられている可能性が高いため両方クリア
    return { questionId: null, quickReplies: [] };
  }

  return { questionId, quickReplies };
}
