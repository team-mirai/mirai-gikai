/**
 * 初回メッセージのtopic_titleを「はじめに」に強制上書きする純粋関数
 *
 * LLMが生成したJSON文字列をパースし、topic_titleを上書きして再シリアライズする。
 * パースに失敗した場合はそのまま返す。
 */
export function overrideInitialTopicTitle(generatedText: string): string {
  try {
    const parsed = JSON.parse(generatedText);
    if (typeof parsed === "object" && parsed !== null) {
      parsed.topic_title = "はじめに";
      return JSON.stringify(parsed);
    }
  } catch {
    // JSONでない場合はそのまま返す
  }
  return generatedText;
}
