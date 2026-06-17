export type QuoteSegment = { text: string; highlight: boolean };

/**
 * text を quote（逐語引用）の一致部分で分割する純粋関数。
 *
 * 引用は「…」や "..." で非連続の抜粋を結合していることがあるため、
 * 区切りで断片に分割し、各断片を出現順に探して一致部分を highlight=true にする。
 * 一致が無い／quote が空なら全体を1セグメント（highlight=false）で返す。
 */
export function splitByQuote(
  text: string,
  quote?: string | null
): QuoteSegment[] {
  const fragments = (quote ?? "")
    .split(/…|\.{3}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (fragments.length === 0) return [{ text, highlight: false }];

  // 断片は引用元で出現順に並ぶ前提で、前の一致末尾以降から順に探す。
  const ranges: Array<[number, number]> = [];
  let searchFrom = 0;
  for (const fragment of fragments) {
    const index = text.indexOf(fragment, searchFrom);
    if (index === -1) continue;
    ranges.push([index, index + fragment.length]);
    searchFrom = index + fragment.length;
  }
  if (ranges.length === 0) return [{ text, highlight: false }];

  const segments: QuoteSegment[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), highlight: false });
    }
    segments.push({ text: text.slice(start, end), highlight: true });
    cursor = end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlight: false });
  }
  return segments;
}
