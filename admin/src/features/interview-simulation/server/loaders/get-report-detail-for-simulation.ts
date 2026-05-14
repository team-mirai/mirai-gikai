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
  /** 保存済み config の estimated_duration（分）。本番のタイムマネジメント用 */
  estimatedDurationMinutes: number | null;
}

/**
 * インタビュアーが返した assistant の content (JSON 文字列) から
 * text と quick_replies, next_stage を取り出す。
 * next_stage は summary / summary_complete 判定で使う。
 */
function parseAssistantMessage(content: string): {
  text: string;
  quick_replies: string[] | null;
  nextStage: "chat" | "summary" | "summary_complete" | null;
  hasReport: boolean;
} {
  try {
    const parsed = JSON.parse(content);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "text" in parsed &&
      typeof parsed.text === "string"
    ) {
      const raw = parsed as {
        quick_replies?: unknown;
        next_stage?: unknown;
        report?: unknown;
      };
      const rawQr = raw.quick_replies;
      const quick_replies = Array.isArray(rawQr)
        ? rawQr.filter(
            (v): v is string => typeof v === "string" && v.length > 0
          )
        : null;
      const nextStageRaw = raw.next_stage;
      const nextStage =
        nextStageRaw === "chat" ||
        nextStageRaw === "summary" ||
        nextStageRaw === "summary_complete"
          ? nextStageRaw
          : null;
      return {
        text: parsed.text,
        quick_replies:
          quick_replies && quick_replies.length > 0 ? quick_replies : null,
        nextStage,
        hasReport: raw.report != null,
      };
    }
  } catch {
    /* JSON でない場合はそのまま */
  }
  return {
    text: content,
    quick_replies: null,
    nextStage: null,
    hasReport: false,
  };
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
    const parsed = parseAssistantMessage(m.content);
    if (parsed.hasReport || parsed.nextStage === "summary_complete") {
      summaryCutoffIndex = i;
      break;
    }
  }
  const conversation = rawMessages.slice(0, summaryCutoffIndex).map((m) => {
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
    estimatedDurationMinutes: interviewConfig.estimated_duration ?? null,
  };
}
