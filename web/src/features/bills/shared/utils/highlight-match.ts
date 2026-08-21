/**
 * 検索語に一致した箇所を切り出す。
 *
 * 候補のどこが引っかかったのかを示すために使う。検索の正規化（全角半角の
 * 同一視・空白除去）を通すと元の文字列との位置がずれるため、ここでは
 * 大小文字だけを無視した素の部分一致で位置を探す。見つからなければ
 * ハイライトなしで返す。
 */
export type MatchSegment = { text: string; matched: boolean };

export function highlightMatch(text: string, query: string): MatchSegment[] {
  const needle = query.trim();
  if (!needle) return [{ text, matched: false }];

  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) return [{ text, matched: false }];

  const segments: MatchSegment[] = [];
  if (index > 0) {
    segments.push({ text: text.slice(0, index), matched: false });
  }
  segments.push({
    text: text.slice(index, index + needle.length),
    matched: true,
  });
  if (index + needle.length < text.length) {
    segments.push({ text: text.slice(index + needle.length), matched: false });
  }

  return segments;
}
