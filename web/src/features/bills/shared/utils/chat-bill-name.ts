import type { BillWithContent } from "../types";

/**
 * AIチャットの文脈に載せる議案名。
 *
 * わかりやすいタイトルと正式名称を併記する。タイトルが無い議案では正式名称
 * だけにする。テンプレート文字列に直接埋めると `undefined` が文字列として
 * 入り、それがそのまま LLM の文脈になる。
 */
export function chatBillName(
  bill: Pick<BillWithContent, "name" | "bill_content">
): string {
  const title = bill.bill_content?.title;
  return title ? `${title}（${bill.name}）` : bill.name;
}
