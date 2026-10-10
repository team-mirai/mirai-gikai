import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import {
  findArticleReportsByBillId,
  findBillNameById,
} from "../repositories/article-report-repository";

export async function getArticleReports(billId: string) {
  noStore();

  const [bill, reports] = await Promise.all([
    findBillNameById(billId),
    findArticleReportsByBillId(billId),
  ]);
  if (!bill) return null;

  return { billName: bill.name, reports };
}
