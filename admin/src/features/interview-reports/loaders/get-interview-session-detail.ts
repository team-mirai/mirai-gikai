import { createAdminClient } from "@mirai-gikai/supabase";
import type { InterviewSessionDetail } from "../types";

export async function getInterviewSessionDetail(
  sessionId: string
): Promise<InterviewSessionDetail | null> {
  const supabase = createAdminClient();

  // セッション情報を取得
  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    console.error("Failed to fetch interview session:", sessionError);
    return null;
  }

  // レポートを取得
  const { data: report, error: reportError } = await supabase
    .from("interview_report")
    .select("*")
    .eq("interview_session_id", sessionId)
    .single();

  if (reportError && reportError.code !== "PGRST116") {
    console.error("Failed to fetch interview report:", reportError);
  }

  // メッセージを取得
  const { data: messages, error: messagesError } = await supabase
    .from("interview_messages")
    .select("*")
    .eq("interview_session_id", sessionId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("Failed to fetch interview messages:", messagesError);
  }

  return {
    ...session,
    interview_report: report || null,
    interview_messages: messages || [],
  };
}
