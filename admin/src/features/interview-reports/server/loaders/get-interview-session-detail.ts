import type { InterviewSessionDetail } from "../../shared/types";
import {
  findInterviewMessagesBySessionId,
  findInterviewReportBySessionId,
  findInterviewSessionById,
} from "../repositories/interview-report-repository";

export async function getInterviewSessionDetail(
  sessionId: string
): Promise<InterviewSessionDetail | null> {
  // セッション情報を取得
  let session: Awaited<ReturnType<typeof findInterviewSessionById>>;
  try {
    session = await findInterviewSessionById(sessionId);
  } catch (error) {
    console.error("Failed to fetch interview session:", error);
    return null;
  }

  // レポートを取得
  let report: Awaited<ReturnType<typeof findInterviewReportBySessionId>> = null;
  try {
    report = await findInterviewReportBySessionId(sessionId);
  } catch (error) {
    console.error("Failed to fetch interview report:", error);
  }

  // メッセージを取得
  let messages: Awaited<ReturnType<typeof findInterviewMessagesBySessionId>> =
    [];
  try {
    messages = await findInterviewMessagesBySessionId(sessionId);
  } catch (error) {
    console.error("Failed to fetch interview messages:", error);
  }

  return {
    ...session,
    interview_report: report || null,
    interview_messages: messages || [],
  };
}
