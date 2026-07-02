export interface TextSegment {
  text: string;
  isMatch: boolean;
}

/**
 * テキストを検索語との一致部分・非一致部分に分割する（大文字小文字は区別しない）。
 * ハイライト表示のためのセグメント列を返す。検索語が空の場合は全体を非一致として返す。
 */
export function splitTextByQuery(text: string, query: string): TextSegment[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery || !text) {
    return [{ text, isMatch: false }];
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmedQuery.toLowerCase();
  const segments: TextSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const index = lowerText.indexOf(lowerQuery, cursor);
    if (index === -1) break;
    if (index > cursor) {
      segments.push({ text: text.slice(cursor, index), isMatch: false });
    }
    segments.push({
      text: text.slice(index, index + trimmedQuery.length),
      isMatch: true,
    });
    cursor = index + trimmedQuery.length;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isMatch: false });
  }

  return segments;
}
