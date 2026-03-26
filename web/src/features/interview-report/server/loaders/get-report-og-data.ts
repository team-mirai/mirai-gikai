import "server-only";

import {
  findPublicReportWithSessionById,
  findBillWithContentById,
} from "../repositories/interview-report-repository";

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
  if (session?.interview_configs) {
    const bill = await findBillWithContentById(
      session.interview_configs.bill_id
    );
    const billContent = bill.bill_contents
      ? Array.isArray(bill.bill_contents)
        ? bill.bill_contents[0]
        : bill.bill_contents
      : null;
    billName = billContent?.title || bill.name;
  }

  return {
    summary: report.summary || "",
    billName,
  };
}
