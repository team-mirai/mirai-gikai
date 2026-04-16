import "server-only";

import type {
  PromptBillInput,
  InterviewConfig as PromptInterviewConfig,
  InterviewQuestion as PromptInterviewQuestion,
} from "@mirai-gikai/shared/interview-prompts/types";
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
  mode: "loop" | "bulk";
}

/**
 * インタビュアーが返した assistant の content (JSON 文字列) から
 * text と quick_replies を取り出す。
 */
function parseAssistantMessage(content: string): {
  text: string;
  quick_replies: string[] | null;
} {
  try {
    const parsed = JSON.parse(content);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "text" in parsed &&
      typeof parsed.text === "string"
    ) {
      const rawQr = (parsed as { quick_replies?: unknown }).quick_replies;
      const quick_replies = Array.isArray(rawQr)
        ? rawQr.filter(
            (v): v is string => typeof v === "string" && v.length > 0
          )
        : null;
      return {
        text: parsed.text,
        quick_replies:
          quick_replies && quick_replies.length > 0 ? quick_replies : null,
      };
    }
  } catch {
    /* JSON でない場合はそのまま */
  }
  return { text: content, quick_replies: null };
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

  // 元会話を interviewer / interviewee の text のみに正規化
  const conversation = (messages ?? []).map((m) => {
    const role: "interviewer" | "interviewee" =
      m.role === "assistant" ? "interviewer" : "interviewee";
    if (m.role === "assistant") {
      const parsed = parseAssistantMessage(m.content);
      return {
        role,
        content: parsed.text,
        quick_replies: parsed.quick_replies,
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
    bill_content: {
      title: billData.billTitle,
      summary: billData.billSummary,
      content: billData.billContent,
    },
  };

  const promptInterviewConfig: PromptInterviewConfig = {
    themes: interviewConfig.themes ?? null,
    knowledge_source: interviewConfig.knowledge_source ?? null,
  };

  const promptQuestions: PromptInterviewQuestion[] = (questions ?? []).map(
    (q) => ({
      id: q.id,
      question: q.question,
      quick_replies: q.quick_replies ?? null,
      follow_up_guide: q.follow_up_guide ?? null,
    })
  );

  const mode: "loop" | "bulk" =
    interviewConfig.mode === "bulk" ? "bulk" : "loop";

  return {
    snapshot,
    bill,
    interviewConfig: promptInterviewConfig,
    questions: promptQuestions,
    mode,
  };
}
