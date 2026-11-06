import "server-only";

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
  const rawReports = await findPublicReportsByBillId(billId, 3);
  const reports = mapPublicInterviewReports(rawReports);

  return { reports, totalCount };
}
