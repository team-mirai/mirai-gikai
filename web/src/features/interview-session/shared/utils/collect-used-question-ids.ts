/**
 * パース済みメッセージ配列から、既に使用された questionId を収集する純粋関数
 *
 * assistant メッセージの questionId のみを対象とする
 */
export function collectUsedQuestionIds(
  messages: Array<{ role: string; questionId?: string | null }>
): Set<string> {
  const usedIds = new Set<string>();
  for (const m of messages) {
    if (m.role === "assistant" && m.questionId) {
      usedIds.add(m.questionId);
    }
  }
  return usedIds;
}
