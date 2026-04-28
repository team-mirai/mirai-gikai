/**
 * チャットの system prompt に渡すナレッジソース文字列を決める。
 * トグルが OFF / 未設定なら空文字を返してプロンプト側で省略させる。
 */
export function pickChatKnowledgeSource(
  bill:
    | {
        knowledge_source?: string | null;
        use_knowledge_source_in_chat?: boolean | null;
      }
    | null
    | undefined
): string {
  if (!bill?.use_knowledge_source_in_chat) return "";
  return bill.knowledge_source ?? "";
}
