import "server-only";

import type {
  InterviewMode,
  PromptBillInput,
  InterviewConfig as PromptInterviewConfig,
  InterviewQuestion as PromptInterviewQuestion,
} from "@mirai-gikai/shared/interview-prompts/types";
import { parseAssistantMessageContent } from "@mirai-gikai/shared/interview-report/parse-assistant-message";
import {
  findInterviewConfigById,
  findInterviewQuestionsByConfigId,
} from "@/features/interview-config/server/repositories/interview-config-repository";
import {
  findInterviewMessagesBySessionId,
  findInterviewSessionById,
} from "@/features/interview-reports/server/repositories/interview-report-repository";
import { fetchBillWithContents } from "@/features/topic-analysis/server/repositories/topic-analysis-repository";
import type { OriginalInterviewSnapshot } from "../../shared/types";
import { findInterviewReportById } from "../repositories/interview-simulation-repository";

export interface ReportDetailForSimulation {
  snapshot: OriginalInterviewSnapshot;
  bill: PromptBillInput;
  interviewConfig: PromptInterviewConfig;
  questions: PromptInterviewQuestion[];
  mode: InterviewMode;
  /** 保存済み config の estimated_duration（分）。本番のタイムマネジメント用 */
  estimatedDurationMinutes: number | null;
}

/**
 * シミュレーションに必要な「元レポート + 設定 + 質問 + 議案」を一括取得する。
 */
export async function getReportDetailForSimulation(
  reportId: string
): Promise<ReportDetailForSimulation | null> {
  const report = await findInterviewReportById(reportId);
  if (!report) return null;

  const session = await findInterviewSessionById(report.interview_session_id);
  if (!session) return null;

  const [interviewConfig, questions, messages] = await Promise.all([
    findInterviewConfigById(session.interview_config_id),
    findInterviewQuestionsByConfigId(session.interview_config_id),
    findInterviewMessagesBySessionId(session.id),
  ]);

  if (!interviewConfig) return null;

  const billData = await fetchBillWithContents(interviewConfig.bill_id);

  // 元会話を interviewer / interviewee の text のみに正規化。
  // Summary フェーズ（report 生成・確認ターン）は除外する。
  // 方針: 最初に report フィールドを含む assistant メッセージ or
  //       next_stage === "summary_complete" が出た時点で、以降は除外。
  // next_stage === "summary" のターン自体は「これから要約します」という
  // 移行宣言の発話なので chat 末尾として残す（本番 UI でもそう見える）。
  const rawMessages = messages ?? [];
  let summaryCutoffIndex = rawMessages.length;
  for (let i = 0; i < rawMessages.length; i++) {
    const m = rawMessages[i];
    if (m.role !== "assistant") continue;
    const parsed = parseAssistantMessageContent(m.content);
    if (parsed.hasReport || parsed.nextStage === "summary_complete") {
      summaryCutoffIndex = i;
      break;
    }
  }
  const conversation = rawMessages.slice(0, summaryCutoffIndex).map((m) => {
    const role: "interviewer" | "interviewee" =
      m.role === "assistant" ? "interviewer" : "interviewee";
    if (m.role === "assistant") {
      const parsed = parseAssistantMessageContent(m.content);
      return {
        role,
        content: parsed.text,
        quick_replies: parsed.quickReplies,
      };
    }
    return { role, content: m.content, quick_replies: null };
  });

  // opinions は jsonb で保存されている想定。型は any なので最小整形
  const rawOpinions = Array.isArray(report.opinions)
    ? (report.opinions as Array<{
        title?: string;
        content?: string;
        source_message_id?: string | null;
      }>)
    : [];
  const opinions = rawOpinions.map((o) => ({
    title: o?.title ?? "",
    content: o?.content ?? "",
    source_message_id: o?.source_message_id ?? null,
  }));

  const snapshot: OriginalInterviewSnapshot = {
    reportId: report.id,
    sessionId: session.id,
    configId: interviewConfig.id,
    billId: interviewConfig.bill_id,
    summary: report.summary ?? null,
    stance:
      report.stance === "for" ||
      report.stance === "against" ||
      report.stance === "neutral"
        ? report.stance
        : null,
    role: report.role ?? null,
    roleTitle: report.role_title ?? null,
    roleDescription: report.role_description ?? null,
    opinions,
    conversation,
    totalContentRichness: report.total_content_richness ?? null,
    rating: session.rating ?? null,
  };

  const bill: PromptBillInput = {
    name: billData.bill.name,
    knowledge_source: billData.bill.knowledge_source,
    bill_content: {
      title: billData.billTitle,
      summary: billData.billSummary,
      content: billData.billContent,
    },
  };

  const promptInterviewConfig: PromptInterviewConfig = {
    themes: interviewConfig.themes ?? null,
  };

  const promptQuestions: PromptInterviewQuestion[] = (questions ?? []).map(
    (q) => ({
      id: q.id,
      question: q.question,
      quick_replies: q.quick_replies ?? null,
      follow_up_guide: q.follow_up_guide ?? null,
      target_audience: q.target_audience ?? null,
    })
  );

  return {
    snapshot,
    bill,
    interviewConfig: promptInterviewConfig,
    questions: promptQuestions,
    mode: interviewConfig.mode,
    estimatedDurationMinutes: interviewConfig.estimated_duration ?? null,
  };
}
