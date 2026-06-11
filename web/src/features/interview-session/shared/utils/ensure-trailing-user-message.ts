type ChatMessage = { role: string; content: string };

// chat→summary の自動遷移では、新しい user メッセージなしでレポート生成を依頼するため
// メッセージ末尾が assistant になる。GPT 系は許容するが Anthropic 系などは
// 「会話は user メッセージで終わる必要がある」として 400 を返すため、続行を促す
// user メッセージを補ってモデル呼び出しを provider 非依存にする。
const SUMMARY_TRIGGER_MESSAGE =
  "ここまでの会話内容をもとに、インタビューのレポートを作成してください。";
const CONTINUE_TRIGGER_MESSAGE = "続けてください。";

/**
 * モデルへ渡すメッセージ列の末尾が assistant の場合に、続行を促す user メッセージを補う。
 * 補った user メッセージは LLM 呼び出し専用で、トランスクリプト（DB）には保存しない。
 * 末尾が user（通常のチャットターン）の場合はそのまま返す。
 */
export function ensureTrailingUserMessage(
  messages: ChatMessage[],
  isSummaryPhase: boolean
): ChatMessage[] {
  if (messages.at(-1)?.role !== "assistant") {
    return messages;
  }
  return [
    ...messages,
    {
      role: "user",
      content: isSummaryPhase
        ? SUMMARY_TRIGGER_MESSAGE
        : CONTINUE_TRIGGER_MESSAGE,
    },
  ];
}
