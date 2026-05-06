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
    const publicReportCount = await countPublicReportsByBillId(billId);
    if (!shouldDisplayPublicReports(publicReportCount)) {
      return null;
    }

    const bill = await findBillWithContentById(billId);
    const billContent = selectPrimaryBillContent(bill.bill_contents);
    billName = billContent?.title || bill.name;
  }

  return {
    summary: report.summary || "",
    billName,
  };
}
