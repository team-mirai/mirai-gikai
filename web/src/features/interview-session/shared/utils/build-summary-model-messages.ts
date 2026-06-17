type ChatMessage = { role: string; content: string };

// chat→summary の自動遷移では、新しい user メッセージなしでレポート生成を依頼するため
// 末尾の user メッセージが存在しない。Anthropic 系は「会話は user メッセージで
// 終わる必要がある」として 400 を返すため、レポート作成を促す合成メッセージで補う。
const SUMMARY_TRIGGER_MESSAGE =
  "ここまでの会話内容をもとに、インタビューのレポートを作成してください。";

/**
 * summary フェーズでモデルへ渡すメッセージ列を構築する。
 *
 * summary フェーズは会話履歴全文（msg_id 付き）をシステムプロンプトに埋め込むため、
 * messages にも全履歴を渡すと入力トークンが二重になる。末尾の user メッセージ
 * （レポート修正依頼など）のみを渡し、末尾が user でない場合はレポート作成を促す
 * 合成 user メッセージを渡す。合成メッセージは LLM 呼び出し専用で DB には保存しない。
 * なお末尾の user メッセージ1件のみ、システムプロンプト内の会話履歴とモデル入力の
 * 両方に現れるが、これは意図した挙動。
 */
export function buildSummaryModelMessages(
  messages: ChatMessage[]
): ChatMessage[] {
  const lastMessage = messages.at(-1);
  if (lastMessage?.role === "user") {
    return [lastMessage];
  }
  return [{ role: "user", content: SUMMARY_TRIGGER_MESSAGE }];
}
