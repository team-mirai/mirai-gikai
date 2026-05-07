import "server-only";

import { shouldDisplayPublicReports } from "@mirai-gikai/shared/report-publication/auto-publish";
import {
  countPublicReportsByBillId,
  findBillWithContentById,
  findPublicReportWithSessionById,
} from "../repositories/interview-report-repository";
import {
  getBillIdFromPublicReportSession,
  selectPrimaryBillContent,
} from "../../shared/utils/public-report-display";

export interface ReportOgData {
  summary: string;
  billName: string;
}

/**
 * OGP画像生成に必要なレポートデータを取得
 */
export async function getReportOgData(
  reportId: string
): Promise<ReportOgData | null> {
  let report: Awaited<ReturnType<typeof findPublicReportWithSessionById>>;
  try {
    report = await findPublicReportWithSessionById(reportId);
  } catch {
    return null;
  }

  const session = report.interview_sessions as {
    started_at: string;
    completed_at: string | null;
    interview_configs: { bill_id: string } | null;
  } | null;

  let billName = "";
  const billId = getBillIdFromPublicReportSession(session);
  if (billId) {
    let publicReportCount: number;
    try {
      publicReportCount = await countPublicReportsByBillId(billId);
    } catch (error) {
      console.error("Failed to count public reports for OGP:", error);
      return null;
    }
    if (!shouldDisplayPublicReports(publicReportCount)) {
      return null;
    }

    let bill: Awaited<ReturnType<typeof findBillWithContentById>>;
    try {
      bill = await findBillWithContentById(billId);
    } catch (error) {
      console.error("Failed to fetch bill for OGP:", error);
      return null;
    }
    const billContent = selectPrimaryBillContent(bill.bill_contents);
    billName = billContent?.title || bill.name;
  }

  return {
    summary: report.summary || "",
    billName,
  };
}
