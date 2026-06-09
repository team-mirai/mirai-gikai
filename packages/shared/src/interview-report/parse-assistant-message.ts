export type ParsedAssistantMessage = {
  /** 表示テキスト（JSONでない/textを持たない場合は原文） */
  text: string;
  quickReplies: string[] | null;
  nextStage: "chat" | "summary" | "summary_complete" | null;
  /** report フィールドを含む（＝要約フェーズのレポート提示ターン）か */
  hasReport: boolean;
};

/**
 * インタビュアー(assistant)の保存済みメッセージ content(JSON文字列) から
 * text / quick_replies / next_stage / report有無 を取り出す純粋関数。
 * JSON でない場合は原文を text として返す。
 *
 * 要約フェーズの判定（再抽出のチャットフェーズ抽出・シミュレーションの会話整形）で共通利用する。
 */
export function parseAssistantMessageContent(
  content: string
): ParsedAssistantMessage {
  try {
    const parsed = JSON.parse(content);
    if (
      parsed &&
      typeof parsed === "object" &&
      "text" in parsed &&
      typeof parsed.text === "string"
    ) {
      const raw = parsed as {
        text: string;
        quick_replies?: unknown;
        next_stage?: unknown;
        report?: unknown;
      };
      const rawQr = raw.quick_replies;
      const quickReplies = Array.isArray(rawQr)
        ? rawQr.filter((v): v is string => typeof v === "string" && v.length > 0)
        : null;
      const nextStage =
        raw.next_stage === "chat" ||
        raw.next_stage === "summary" ||
        raw.next_stage === "summary_complete"
          ? raw.next_stage
          : null;
      return {
        text: raw.text,
        quickReplies:
          quickReplies && quickReplies.length > 0 ? quickReplies : null,
        nextStage,
        hasReport: raw.report != null,
      };
    }
  } catch {
    // JSON でない場合は原文を使う
  }
  return { text: content, quickReplies: null, nextStage: null, hasReport: false };
}

/** assistant メッセージが要約フェーズのレポート提示ターンかどうか。 */
export function isReportTurn(content: string): boolean {
  const parsed = parseAssistantMessageContent(content);
  return parsed.hasReport || parsed.nextStage === "summary_complete";
}
