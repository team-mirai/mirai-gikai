import type { BillWithContent } from "../types";

/**
 * タグ別一覧で議案をフルカードで出すかを判定する。
 * 先頭の議案に加え、AIインタビュー受付中の議案は参加の入口として目立たせたいので
 * 2件目以降でもフルカードにする。
 */
export function shouldShowFullBillCard(
  bill: Pick<BillWithContent, "hasPublicInterview">,
  index: number
): boolean {
  return index === 0 || bill.hasPublicInterview === true;
}
