import "server-only";

import type { InterviewReport } from "../../shared/types";
import {
  findBillWithContentById,
  findMessagesBySessionId,
  findPublicReportWithSessionById,
} from "../repositories/interview-report-repository";

export type PublicReportData = InterviewReport & {
  bill_id: string;
  session_started_at: string;
  session_completed_at: string | null;
  bill: {
    id: string;
    name: string;
    thumbnail_url: string | null;
    bill_content: { title: string } | null;
  };
  characterCount: number;
};

/**
 * 公開レポートをIDから取得（認証不要）
 * 公開条件: is_public_by_admin = true AND is_public_by_user = true
 */
export async function getPublicReportById(
  reportId: string
): Promise<PublicReportData | null> {
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

  if (!session?.interview_configs) {
    return null;
  }

  const billId = session.interview_configs.bill_id;

  const [bill, messages] = await Promise.all([
    findBillWithContentById(billId),
    findMessagesBySessionId(report.interview_session_id),
  ]);

  const { interview_sessions: _, ...reportData } = report;

  return {
    ...reportData,
    bill_id: billId,
    session_started_at: session.started_at,
    session_completed_at: session.completed_at,
    bill: {
      id: bill.id,
      name: bill.name,
      thumbnail_url: bill.thumbnail_url,
      bill_content: bill.bill_contents
        ? Array.isArray(bill.bill_contents)
          ? bill.bill_contents[0]
          : bill.bill_contents
        : null,
    },
    characterCount: messages
      .filter((m) => m.role === "user")
      .reduce((sum, m) => sum + m.content.length, 0),
  };
}
