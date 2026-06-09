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
    content_richness: reportData.content_richness,
    moderation_score: moderationScore,
    moderation_reasoning: moderationReasoning,
    ...(typeof isPublicByUser === "boolean"
      ? { is_public_by_user: isPublicByUser }
      : {}),
    ...(shouldAutoPublish ? { is_public_by_admin: true } : {}),
  };
}
