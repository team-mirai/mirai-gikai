import { enrichOpinionsWithSourceContent } from "@mirai-gikai/shared/interview-report/enrich-opinions";
import { isReportAutoPublishEligible } from "@mirai-gikai/shared/report-publication/auto-publish";
import type { InterviewReportData } from "../schemas";
import type { InterviewMessage, InterviewReportInsert } from "../types";

type CompleteInterviewMessage = Pick<
  InterviewMessage,
  "id" | "role" | "content"
>;

type BuildCompletedInterviewReportInsertParams = {
  sessionId: string;
  messages: CompleteInterviewMessage[];
  reportData: InterviewReportData;
  moderationScore: number | null;
  moderationReasoning: string | null;
  isPublicByUser?: boolean;
};

export function buildCompletedInterviewReportInsert({
  sessionId,
  messages,
  reportData,
  moderationScore,
  moderationReasoning,
  isPublicByUser,
}: BuildCompletedInterviewReportInsertParams): InterviewReportInsert {
  const enrichedOpinions = enrichOpinionsWithSourceContent(
    reportData.opinions,
    messages
  );

  const shouldAutoPublish = isReportAutoPublishEligible({
    isPublicByUser: isPublicByUser ?? false,
    moderationScore,
    totalContentRichness: reportData.content_richness.total,
  });

  return {
    interview_session_id: sessionId,
    summary: reportData.summary,
    stance: reportData.stance,
    role: reportData.role,
    role_description: reportData.role_description,
    role_title: reportData.role_title,
    opinions: enrichedOpinions,
    // 完了（再完了含む）時はレポート内容が（再）確定するため、意見再抽出の
    // ウォーターマークを未処理(NULL)に戻す。これにより再完了で interview_opinion が
    // JSONB 由来の内容へ同期され直しても、次回バックフィルが再抽出して品質を復旧できる。
    opinions_reextracted_at: null,
    content_richness: reportData.content_richness,
    moderation_score: moderationScore,
    moderation_reasoning: moderationReasoning,
    ...(typeof isPublicByUser === "boolean"
      ? { is_public_by_user: isPublicByUser }
      : {}),
    ...(shouldAutoPublish ? { is_public_by_admin: true } : {}),
  };
}
