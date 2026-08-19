import type { BillTag, BillWithContent } from "../types";
import type { BillsListParams } from "./parse-bills-list-params";
import { searchBills } from "./search-bills";

type FilterableBill = Pick<
  BillWithContent,
  "name" | "bill_content" | "tags" | "hasPublicInterview"
>;

/**
 * ステータス以外の絞り込み（キーワード・カテゴリ・受付中）をまとめて適用する。
 *
 * ステータスのタブに出す件数は、この結果を母集合にして数える。先に適用しないと
 * タブの数字が実際に表示される件数とずれる。
 *
 * 引数は params ごと受け取る。個別に並べると string と string | null が隣接して、
 * 入れ替えても型が通ってしまう。
 */
export function filterBills<T extends FilterableBill>(
  bills: readonly T[],
  params: Pick<BillsListParams, "query" | "tagId" | "interviewOnly">
): T[] {
  let filtered = searchBills(bills, params.query);

  if (params.tagId) {
    filtered = filtered.filter((bill) =>
      bill.tags.some((tag) => tag.id === params.tagId)
    );
  }
  if (params.interviewOnly) {
    filtered = filtered.filter((bill) => bill.hasPublicInterview);
  }
  return filtered;
}

/**
 * カテゴリチップに出すタグ。実際に法案が紐づくものだけを、最初に現れた順で返す。
 * 0件のカテゴリを並べても選ぶ意味がない。
 */
export function collectBillTags(
  bills: readonly Pick<BillWithContent, "tags">[]
): BillTag[] {
  const byId = new Map<string, BillTag>();
  for (const bill of bills) {
    for (const tag of bill.tags) {
      if (!byId.has(tag.id)) byId.set(tag.id, tag);
    }
  }
  return [...byId.values()];
}
