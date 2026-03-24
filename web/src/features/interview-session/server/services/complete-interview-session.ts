import "server-only";

import type { InterviewReportData } from "../../shared/schemas";
import type { InterviewReport } from "../../shared/types";
import { extractReportFromMessage } from "../../shared/utils/report-extraction";
import {
  findInterviewMessagesBySessionIdDesc,
  updateInterviewSessionCompleted,
  upsertInterviewReport,
} from "../repositories/interview-session-repository";
import type { ModerationStatus } from "../../shared/utils/moderation";
import { evaluateModerationScore } from "./evaluate-moderation-score";

type CompleteInterviewSessionParams = {
  sessionId: string;
};

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

  // opinions にソースメッセージの内容を付与
  const enrichedOpinions = reportData.opinions.map((opinion) => {
    if (!opinion.source_message_id) {
      return { ...opinion, source_message_content: null };
    }
    const sourceMsg = messages.find((m) => m.id === opinion.source_message_id);
    return {
      ...opinion,
      source_message_content: sourceMsg?.content ?? null,
    };
  });

  // モデレーションスコアを評価
  let moderationScore: number | null = null;
  let moderationStatus: ModerationStatus | null = null;
  try {
    const moderation = await evaluateModerationScore({
      summary: reportData.summary,
      opinions: reportData.opinions,
      roleDescription: reportData.role_description,
    });
    moderationScore = moderation.score;
    moderationStatus = moderation.status;
  } catch (error) {
    // モデレーション失敗はレポート保存をブロックしない
    console.error("Moderation evaluation failed:", error);
  }

  // レポートを保存（UPSERT）
  // content_richnessはZodスキーマでバリデーション済み（totalは0-100の整数）
  const report = await upsertInterviewReport({
    interview_session_id: sessionId,
    summary: reportData.summary,
    stance: reportData.stance,
    role: reportData.role,
    role_description: reportData.role_description,
    role_title: reportData.role_title,
    opinions: enrichedOpinions,
    content_richness: reportData.content_richness,
    moderation_score: moderationScore,
    moderation_status: moderationStatus,
  });

  // セッションを完了
  await updateInterviewSessionCompleted(sessionId);

  return report;
}
