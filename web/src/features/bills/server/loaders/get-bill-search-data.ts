import "server-only";

import type { BillSearchData } from "../../shared/types/bill-search-data";
import { countTagChipItems } from "../../shared/utils/tag-chip-items";
import { getFeaturedTags } from "./get-featured-tags";
import { getSuggestableBills } from "./get-suggestable-bills";

/**
 * 検索モーダルの中身。トップの検索入口とヘッダーのメニューで共有する。
 *
 * チップの件数は全会期の公開議案から数える。チップの飛び先が /bills で、
 * あちらも全会期を数えるため、押す前と後で数字が変わらない。候補用に取得
 * 済みの配列をそのまま使うので、集計のためのクエリは増えない。
 */
export async function getBillSearchData(): Promise<BillSearchData> {
  const [bills, featuredTags] = await Promise.all([
    getSuggestableBills(),
    getFeaturedTags(),
  ]);
  return { tags: countTagChipItems(featuredTags, bills), bills };
}
