import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import {
  type InterviewReportData,
  interviewChatWithReportSchema,
} from "../../shared/schemas";
import type { InterviewReport } from "../../shared/types";

type CompleteInterviewSessionParams = {
  sessionId: string;
};

/**
 * メッセージからレポートを抽出する
 */
function extractReportFromMessage(content: string): InterviewReportData | null {
  try {
    const parsed = JSON.parse(content);
    const result = interviewChatWithReportSchema.safeParse(parsed);
    if (result.success) {
      return result.data.report;
    }
  } catch (e) {
    // JSONでない場合は無視
    console.error("Failed to parse report from message content", content, e);
  }
  return null;
}

/**
 * インタビューを完了し、会話中に生成されたレポートを保存する
 */
export async function completeInterviewSession({
  sessionId,
}: CompleteInterviewSessionParams): Promise<InterviewReport> {
  const supabase = createAdminClient();

  // メッセージ履歴を取得（新しい順）
  const { data: messages, error: messagesError } = await supabase
    .from("interview_messages")
    .select("*")
    .eq("interview_session_id", sessionId)
    .order("created_at", { ascending: false });

  if (messagesError || !messages) {
    throw new Error(
      `Failed to fetch interview messages: ${messagesError?.message ?? "unknown"}`
    );
  }

  // 最新のアシスタントメッセージからレポートを抽出
  let reportData: InterviewReportData | null = null;
  for (const message of messages) {
    if (message.role === "assistant") {
      reportData = extractReportFromMessage(message.content);
      if (reportData) {
        break;
      }
    }
  }

  if (!reportData) {
    throw new Error("No report found in conversation messages");
  }

  // レポートを保存（UPSERT）
  // scoresはZodスキーマでバリデーション済み（totalは0-100の整数）
  const { data: report, error: upsertError } = await supabase
    .from("interview_report")
    .upsert(
      {
        interview_session_id: sessionId,
        summary: reportData.summary,
        stance: reportData.stance,
        role: reportData.role,
        role_description: reportData.role_description,
        role_title: reportData.role_title,
        opinions: reportData.opinions,
        scores: reportData.scores,
      },
      { onConflict: "interview_session_id" }
    )
    .select()
    .single();

  if (upsertError || !report) {
    throw new Error(
      `Failed to save interview report: ${upsertError?.message ?? "unknown"}`
    );
  }

  // セッションを完了
  const { error: sessionUpdateError } = await supabase
    .from("interview_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (sessionUpdateError) {
    throw new Error(
      `Failed to complete interview session: ${sessionUpdateError?.message ?? "unknown"}`
    );
  }

  return report;
}
