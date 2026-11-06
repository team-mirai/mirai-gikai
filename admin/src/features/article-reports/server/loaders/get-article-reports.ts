import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { z } from "zod";
import {
  findArticleReportsByBillId,
  findBillNameById,
} from "../repositories/article-report-repository";

const ARTICLE_REPORTS_LIMIT = 200;

export async function getArticleReports(billId: string) {
  noStore();
  if (!z.uuid().safeParse(billId).success) return null;

  const [bill, reports] = await Promise.all([
    findBillNameById(billId),
    findArticleReportsByBillId(billId, ARTICLE_REPORTS_LIMIT),
  ]);
  if (!bill) return null;

  return {
    billName: bill.name,
    reports,
    limit: ARTICLE_REPORTS_LIMIT,
    reachedLimit: reports.length >= ARTICLE_REPORTS_LIMIT,
  };
}
