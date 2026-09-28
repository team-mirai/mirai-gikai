import type { PublicOpinion } from "../types";
import { filterOpinions, type TopicFilter } from "./filter-topics";

/** 重複判定用に引用文を正規化する（前後空白の除去・連続空白の圧縮）。 */
function normalizeQuote(quote: string): string {
  return quote.trim().replace(/\s+/g, " ");
}

/** 引用を持つ意見のみを残し、同一引用文の重複を先勝ちで除く。 */
function uniqueQuotedOpinions(opinions: PublicOpinion[]): PublicOpinion[] {
  const seen = new Set<string>();
  return opinions.filter((o) => {
    const key = normalizeQuote(o.contextual_quote ?? "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * トピックカードに表示する代表意見の引用を選ぶ。
 * フィルタ該当意見の引用を優先し、無ければ全体から拾う。
 * 同じ引用文（クイックリプライの選択肢など）は1件にまとめる。
 */
export function pickCardQuotes(
  opinions: PublicOpinion[],
  filter: TopicFilter,
  maxQuotes: number
): PublicOpinion[] {
  const matched = uniqueQuotedOpinions(filterOpinions(opinions, filter));
  const candidates =
    matched.length > 0 ? matched : uniqueQuotedOpinions(opinions);
  return candidates.slice(0, maxQuotes);
}
