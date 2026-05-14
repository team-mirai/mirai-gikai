import "server-only";

import { shouldDisplayPublicReports } from "@mirai-gikai/shared/report-publication/auto-publish";
import {
  mapPublicInterviewReports,
  type PublicInterviewReportDisplay,
} from "../../shared/utils/public-report-display";
import {
  countPublicReportsByBillId,
  findPublicReportsByBillId,
} from "../repositories/interview-report-repository";

export type PublicInterviewReport = PublicInterviewReportDisplay;

export type PublicReportsResult = {
  reports: PublicInterviewReport[];
  totalCount: number;
};

/**
 * 議案IDから公開インタビューレポート（最大3件）と総件数を取得
 */
export async function getPublicReportsByBillId(
  billId: string
): Promise<PublicReportsResult> {
  const totalCount = await countPublicReportsByBillId(billId);

  if (!shouldDisplayPublicReports(totalCount)) {
    return { reports: [], totalCount: 0 };
  }

  const rawReports = await findPublicReportsByBillId(billId, 3);
  const reports = mapPublicInterviewReports(rawReports);

  return { reports, totalCount };
}
