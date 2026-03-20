/**
 * メッセージのcontentからテキスト部分を抽出する。
 * AIメッセージはJSON形式（{text, quick_replies, ...}）で保存されているため、
 * textフィールドを取り出す。JSONでない場合はそのまま返す。
 */
export function getMessageDisplayText(content: string): string {
  try {
    const parsed = JSON.parse(content);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "text" in parsed &&
      typeof parsed.text === "string"
    ) {
      return parsed.text;
    }
  } catch {
    // JSONでない場合はそのままテキストとして扱う
  }
  return content;
}
