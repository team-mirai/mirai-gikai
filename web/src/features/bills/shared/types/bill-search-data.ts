import type { SuggestableBill } from "../utils/suggest-bills";
import type { TagChipItem } from "../utils/tag-chip-items";

/** 検索モーダルに渡すもの。キーワード候補の元になる議案と、テーマのチップ。 */
export type BillSearchData = {
  tags: TagChipItem[];
  bills: SuggestableBill[];
};
