"use server";

import type { BillSearchData } from "../../shared/types/bill-search-data";
import { getBillSearchData } from "../loaders/get-bill-search-data";

/**
 * ヘッダーのメニューから検索モーダルを開くときに中身を取りに行く。
 *
 * ヘッダーは全ページに載るので、レイアウトで先に読み込むと開かれない
 * モーダルのために全ページが議案一覧を抱え、その取得を待つことになる。
 */
export async function loadBillSearchData(): Promise<BillSearchData> {
  return getBillSearchData();
}
