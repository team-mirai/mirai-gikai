import "server-only";

import type { BillWithContent } from "@/features/bills/shared/types";
import type { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import type { getInterviewQuestions } from "@/features/interview-config/server/loaders/get-interview-questions";

/**
 * システムプロンプト構築用パラメータ
 */
export interface InterviewPromptParams {
  bill: BillWithContent | null;
  interviewConfig: Awaited<ReturnType<typeof getInterviewConfig>>;
  questions: Awaited<ReturnType<typeof getInterviewQuestions>>;
  nextQuestionId?: string;
  currentStage: "chat" | "summary" | "summary_complete";
  askedQuestionIds: Set<string>;
}

/**
 * インタビュー質問の型
 */
export type InterviewQuestion = Awaited<
  ReturnType<typeof getInterviewQuestions>
>[number];

/**
 * 次の質問ID算出用パラメータ
 */
export interface NextQuestionParams {
  messages: Array<{ role: string; content: string }>;
  questions: InterviewQuestion[];
}

/**
 * モードの実装インターフェース
 *
 * 各モード（bulk, loop）はこのインターフェースを実装する
 * 1ファイルを見れば、そのモードの全ロジックを把握できる
 */
export interface InterviewModeLogic {
  /**
   * システムプロンプトを構築
   */
  buildSystemPrompt(params: InterviewPromptParams): string;

  /**
   * 次に聞くべき質問IDを算出
   * @returns 質問ID。このモードで次の質問を強制しない場合はundefined
   */
  calculateNextQuestionId(params: NextQuestionParams): string | undefined;
}
