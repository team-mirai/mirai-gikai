/**
 * テキストを句読点（。？！?!）で分割する。
 * 区切り文字は前の文に含める。
 * 空文字列の場合は空配列を返す。
 */
export function splitSentences(text: string): string[] {
  if (!text) return [];
  const parts = text.split(/(?<=[。？！?!])/);
  return parts.filter((s) => s.length > 0);
}
