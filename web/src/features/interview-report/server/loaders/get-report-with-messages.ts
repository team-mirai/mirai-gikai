import "server-only";

import {
  getAuthenticatedUser,
  isSessionOwner,
} from "@/features/interview-session/server/utils/verify-session-ownership";
import type { InterviewMessage } from "@/features/interview-session/shared/types";
import type { InterviewReport } from "../../shared/types";
import {
  canViewReportWithMessages,
  selectPrimaryBillContent,
} from "../../shared/utils/public-report-display";
import {
  countPublicReportsByBillId,
  findBillWithContentById,
  findMessagesBySessionId,
  findReportWithSessionById,
} from "../repositories/interview-report-repository";

export type ReportWithMessages = {
  report: InterviewReport & {
    bill_id: string;
    session_started_at: string;
    session_completed_at: string | null;
  };
  messages: InterviewMessage[];
  bill: {
    id: string;
    name: string;
    thumbnail_url: string | null;
    bill_content: {
      title: string;
    } | null;
  };
};

/**
 * Fetch report with all messages for the chat log page.
 * Authorization: Accessible if the report is public OR the user is the session owner.
 */
export async function getReportWithMessages(
  reportId: string
): Promise<ReportWithMessages | null> {
  const authResult = await getAuthenticatedUser();
  const userId = authResult.authenticated ? authResult.userId : null;

  let report: Awaited<ReturnType<typeof findReportWithSessionById>>;
  try {
    report = await findReportWithSessionById(reportId);
  } catch (error) {
    console.error("Failed to fetch interview report:", error);
    return null;
  }

  const session = report.interview_sessions as {
    user_id: string;
    started_at: string;
    completed_at: string | null;
    interview_configs: { bill_id: string } | null;
  } | null;

  if (!session || !session.interview_configs) {
    console.error("Session or config not found for report");
    return null;
  }

  // Authorization check: public OR owner
  const isOwner = userId ? isSessionOwner(session.user_id, userId) : false;
  const billId = session.interview_configs.bill_id;

  if (!isOwner) {
    let publicReportCount: number;
    try {
      publicReportCount = await countPublicReportsByBillId(billId);
    } catch (error) {
      console.error("Failed to count public reports:", error);
      return null;
    }

    const isPublic = canViewReportWithMessages({
      isOwner,
      isPublicByAdmin: report.is_public_by_admin,
      isPublicByUser: report.is_public_by_user,
      publicReportCount,
    });

    if (!isPublic) {
      return null;
    }
  }

  // Fetch messages
  let messages: InterviewMessage[];
  try {
    messages = await findMessagesBySessionId(report.interview_session_id);
  } catch (error) {
    console.error("Failed to fetch interview messages:", error);
    return null;
  }

  // Fetch bill info
  let bill: Awaited<ReturnType<typeof findBillWithContentById>>;
  try {
    bill = await findBillWithContentById(billId);
  } catch (error) {
    console.error("Failed to fetch bill:", error);
    return null;
  }

  const { interview_sessions: _, ...reportData } = report;

  return {
    report: {
      ...reportData,
      bill_id: billId,
      session_started_at: session.started_at,
      session_completed_at: session.completed_at,
    },
    messages: messages || [],
    bill: {
      id: bill.id,
      name: bill.name,
      thumbnail_url: bill.thumbnail_url,
      bill_content: selectPrimaryBillContent(bill.bill_contents),
    },
  };
}
