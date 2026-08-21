import { type SearchableBill, searchBills } from "./search-bills";

/**
 * 候補に出すために最小限まで削った議案。
 *
 * 検索の入力条件は `SearchableBill` が持つ。候補は遷移先が必要なので id を足す。
 */
export type SuggestableBill = SearchableBill & { id: string };

/** 候補として出す上限。多く出しても選ばれないうえ、モーダルが縦に伸びる。 */
const SUGGEST_LIMIT = 6;

/**
 * 入力に対する候補を返す。
 *
 * 絞り込みは一覧ページと同じ `searchBills` に任せる。要約を候補の対象から
 * 外すのは、渡すデータ側で要約を持たせないことで担保している。
 *
 * 空クエリでは候補を出さない。入力前に一覧を開いても選ぶ手がかりがない。
 */
export function suggestBills<T extends SuggestableBill>(
  bills: readonly T[],
  query: string
): T[] {
  if (!query.trim()) return [];

  return searchBills(bills, query).slice(0, SUGGEST_LIMIT);
}
