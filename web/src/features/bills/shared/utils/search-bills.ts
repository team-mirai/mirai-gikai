import type { BillTag, BillWithContent } from "../types";

type SearchableBill = Pick<BillWithContent, "name" | "bill_content" | "tags">;

/**
 * 法案のキーワード検索（部分一致）。
 *
 * 正式名称・わかりやすいタイトル・要約・タグ名を対象にする。利用者は
 * 「ガソリン税」のような通称や「暮らし」のようなカテゴリ名でも探すため、
 * 正式名称だけに当てると引っかからない。
 *
 * 空クエリは絞り込まない（一覧の初期表示が全件になる）。検索ビューが
 * 独立している admin の意見検索とは違い、ここは一覧そのものなので
 * クエリ無しで全件を出すのが自然。
 */
export function searchBills<T extends SearchableBill>(
  bills: readonly T[],
  query: string
): T[] {
  const needle = normalize(query);
  if (!needle) return [...bills];

  return bills.filter((bill) =>
    [
      bill.name,
      bill.bill_content?.title,
      bill.bill_content?.summary,
      ...bill.tags.map((tag: BillTag) => tag.label),
    ].some((field) => field && normalize(field).includes(needle))
  );
}

/**
 * 比較用に正規化する。
 *
 * 全角英数と半角を同一視し、大小文字とスペースの差を無視する。「AI」を
 * 「ＡＩ」と打つ利用者を取りこぼさないため。
 */
function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}
