import "server-only";

import {
  getAuthenticatedUser,
  isSessionOwner,
} from "@/features/interview-session/server/utils/verify-session-ownership";
import type { InterviewMessage } from "@/features/interview-session/shared/types";
import type { InterviewReport } from "../../shared/types";
import {
  findBillWithContentById,
  findMessagesBySessionId,
  findReportWithSessionById,
} from "../repositories/interview-report-repository";

export type ReportWithMessages = {
  report: InterviewReport & {
    bill_id: string;
    session_started_at: string;
    session_completed_at: string | null;
    is_public_by_user: boolean;
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
  isOwner: boolean;
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
    is_public_by_user: boolean;
    interview_configs: { bill_id: string } | null;
  } | null;

  if (!session || !session.interview_configs) {
    console.error("Session or config not found for report");
    return null;
  }

  // Authorization check: public OR owner
  const isOwner = userId ? isSessionOwner(session.user_id, userId) : false;
  const isPublic = session.is_public_by_user;

  if (!isPublic && !isOwner) {
    console.error("Unauthorized access to interview report chat log");
    return null;
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
    bill = await findBillWithContentById(session.interview_configs.bill_id);
  } catch (error) {
    console.error("Failed to fetch bill:", error);
    return null;
  }

  const { interview_sessions: _, ...reportData } = report;

  return {
    report: {
      ...reportData,
      bill_id: session.interview_configs.bill_id,
      session_started_at: session.started_at,
      session_completed_at: session.completed_at,
      is_public_by_user: session.is_public_by_user,
    },
    messages: messages || [],
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
    isOwner,
  };
}
