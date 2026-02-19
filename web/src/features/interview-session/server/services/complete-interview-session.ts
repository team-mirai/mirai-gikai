import "server-only";

import {
  type InterviewReportData,
  interviewChatWithReportSchema,
} from "../../shared/schemas";
import type { InterviewReport } from "../../shared/types";
import {
  findInterviewMessagesBySessionIdDesc,
  updateInterviewSessionCompleted,
  upsertInterviewReport,
} from "../repositories/interview-session-repository";

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
  // メッセージ履歴を取得（新しい順）
  const messages = await findInterviewMessagesBySessionIdDesc(sessionId);

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
  const report = await upsertInterviewReport({
    interview_session_id: sessionId,
    summary: reportData.summary,
    stance: reportData.stance,
    role: reportData.role,
    role_description: reportData.role_description,
    role_title: reportData.role_title,
    opinions: reportData.opinions,
    scores: reportData.scores,
  });

  // セッションを完了
  await updateInterviewSessionCompleted(sessionId);

  return report;
}
