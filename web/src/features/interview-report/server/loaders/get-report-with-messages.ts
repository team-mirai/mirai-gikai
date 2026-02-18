import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import {
  getAuthenticatedUser,
  isSessionOwner,
} from "@/features/interview-session/server/utils/verify-session-ownership";
import type { InterviewMessage } from "@/features/interview-session/shared/types";
import type { InterviewReport } from "../../shared/types";

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

  const supabase = createAdminClient();

  // Fetch report with session and config info
  const { data: report, error: reportError } = await supabase
    .from("interview_report")
    .select(
      "*, interview_sessions(user_id, started_at, completed_at, is_public_by_user, interview_configs(bill_id))"
    )
    .eq("id", reportId)
    .single();

  if (reportError || !report) {
    console.error("Failed to fetch interview report:", reportError);
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
  const { data: messages, error: messagesError } = await supabase
    .from("interview_messages")
    .select("*")
    .eq("interview_session_id", report.interview_session_id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("Failed to fetch interview messages:", messagesError);
    return null;
  }

  // Fetch bill info
  const { data: bill, error: billError } = await supabase
    .from("bills")
    .select("id, name, thumbnail_url, bill_contents(title)")
    .eq("id", session.interview_configs.bill_id)
    .single();

  if (billError || !bill) {
    console.error("Failed to fetch bill:", billError);
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
  };
}
