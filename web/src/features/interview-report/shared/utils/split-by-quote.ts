export type QuoteSegment = { text: string; highlight: boolean };

/**
 * text を quote（逐語引用）の最初の一致で分割する純粋関数。
 * 一致部分は highlight=true のセグメントとして返し、呼び出し側で太字表示する。
 * quote が空、または一致しない場合は全体を1セグメント（highlight=false）で返す。
 */
export function splitByQuote(
  text: string,
  quote?: string | null
): QuoteSegment[] {
  const q = quote?.trim();
  if (!q) return [{ text, highlight: false }];

  const index = text.indexOf(q);
  if (index === -1) return [{ text, highlight: false }];

  const segments: QuoteSegment[] = [];
  if (index > 0) {
    segments.push({ text: text.slice(0, index), highlight: false });
  }
  segments.push({ text: text.slice(index, index + q.length), highlight: true });
  const rest = text.slice(index + q.length);
  if (rest) {
    segments.push({ text: rest, highlight: false });
  }
  return segments;
}
