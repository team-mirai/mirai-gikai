import type { BillTag } from "../types";
import { type SearchableBill, searchBills } from "./search-bills";

/**
 * 候補に出すために最小限まで削った議案。
 *
 * 要約を持たせない形にしてある。候補行に出るのはタイトルだけなので、要約に
 * 当たって出てきた行は「なぜこれが出たのか」が読み手に分からない。渡す側の
 * 実装に頼らず、型で要約を受け取れないようにしておく。
 */
export type SuggestableBill = Omit<SearchableBill, "bill_content" | "tags"> & {
  id: string;
  bill_content?: { title?: string | null };
  /** モーダルのテーマ別件数を数えるため id も持つ。 */
  tags: BillTag[];
};

/** 候補として出す上限。多く出しても選ばれないうえ、モーダルが縦に伸びる。 */
const SUGGEST_LIMIT = 6;

/**
 * 入力に対する候補を返す。
 *
 * 絞り込みは一覧ページと同じ `searchBills` に任せる。要約が対象から外れるのは
 * `SuggestableBill` が要約を持たないため。
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
