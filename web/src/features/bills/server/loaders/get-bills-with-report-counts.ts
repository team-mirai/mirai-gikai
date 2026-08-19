import { countPublicReportsByBillIds } from "@mirai-gikai/shared/report-publication/count-public-reports";
import type { BillWithContent } from "../../shared/types";
import { getBills } from "./get-bills";

/**
 * 一覧用に、公開レポート件数を添えた法案を返す。
 *
 * 件数は議案ごとに数えるとクエリが議案数ぶんに膨らむので、DB側で集約する
 * （count_public_reports_by_bill_ids）。0件の議案はRPCの返り値に現れないため 0 を埋める。
 *
 * getBills 側のキャッシュとは別に毎回集計する。回答数は分単位で増えるので、
 * 法案本体と同じ10分キャッシュに載せると数字が古く見える。
 */
export async function getBillsWithReportCounts(): Promise<BillWithContent[]> {
  const bills = await getBills();
  const counts = await countPublicReportsByBillIds(
    bills.map((bill) => bill.id)
  );

  return bills.map((bill) => ({
    ...bill,
    publicReportCount: counts.get(bill.id) ?? 0,
  }));
}
