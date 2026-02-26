import type { BillWithContent } from "@/features/bills/shared/types";

/**
 * インタビュー設定の型（純粋関数用）
 */
export type InterviewConfig = {
  themes?: string[] | null;
  knowledge_source?: string | null;
  [key: string]: unknown;
} | null;

/**
 * インタビュー質問の型（純粋関数用）
 */
export interface InterviewQuestion {
  id: string;
  question: string;
  quick_replies?: string[] | null;
  follow_up_guide?: string | null;
}

/**
 * システムプロンプト構築用パラメータ（純粋関数用）
 */
export interface InterviewPromptInput {
  bill: BillWithContent | null;
  interviewConfig: InterviewConfig;
  questions: InterviewQuestion[];
  nextQuestionId?: string;
  currentStage: "chat" | "summary" | "summary_complete";
  askedQuestionIds: Set<string>;
  remainingMinutes?: number | null;
}

/**
 * 次の質問ID算出用パラメータ（純粋関数用）
 */
export interface NextQuestionInput {
  messages: Array<{ role: string; content: string }>;
  questions: Array<{ id: string }>;
}
