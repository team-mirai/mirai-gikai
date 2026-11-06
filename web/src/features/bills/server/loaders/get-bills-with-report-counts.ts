import "server-only";

import { countPublicReportsByBillIds } from "@mirai-gikai/shared/report-publication/count-public-reports";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent } from "../../shared/types";
import { getBills } from "./get-bills";

/**
 * 回答数のキャッシュ。
 *
 * /bills は searchParams と cookie を読むため毎リクエスト動的に描画される。
 * 素で集計すると、全公開レポートを走る集計クエリが絞り込みのクリックごとに走る。
 *
 * 一方で法案本体の 600 秒キャッシュに載せると数字が古く見えるので、短い TTL を
 * 別に持たせる。回答数は「💬 N人が回答」の粗いバッジと並び替えのキーにしか
 * 使わないので、1分の遅れは体感に出ない。
 *
 * admin のレポート公開操作は revalidateTag("public-interview-reports") を
 * 呼んでいるが、これまで読み手が居なかった。ここで購読して即時反映させる。
 */
const getCachedReportCounts = unstable_cache(
  async (billIds: string[]) => {
    const counts = await countPublicReportsByBillIds(billIds);
    // unstable_cache は Map を返せないので配列で保存する。
    return [...counts.entries()];
  },
  ["bills-public-report-counts"],
  { revalidate: 60, tags: [CACHE_TAGS.PUBLIC_INTERVIEW_REPORTS] }
);

/**
 * 一覧用に、公開レポート件数を添えた法案を返す。
 *
 * 件数は議案ごとに数えるとクエリが議案数ぶんに膨らむので、DB側で集約する
 * （count_public_reports_by_bill_ids）。0件の議案はRPCの返り値に現れないため 0 を埋める。
 */
export async function getBillsWithReportCounts(): Promise<BillWithContent[]> {
  const bills = await getBills();
  const counts = new Map(
    await getCachedReportCounts(bills.map((bill) => bill.id))
  );

  return bills.map((bill) => ({
    ...bill,
    publicReportCount: counts.get(bill.id) ?? 0,
  }));
}
