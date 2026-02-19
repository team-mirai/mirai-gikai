/**
 * テキストエリアから配列への変換ヘルパー
 * 改行区切りテキストを配列に変換する
 */
export function textToArray(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * 配列からテキストエリア用の文字列への変換ヘルパー
 */
export function arrayToText(array: string[] | null | undefined): string {
  if (!array || array.length === 0) return "";
  return array.join("\n");
}
