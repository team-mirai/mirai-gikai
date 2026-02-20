import "server-only";

import type { BillWithContent } from "@/features/bills/shared/types";
import type { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import type { getInterviewQuestions } from "@/features/interview-config/server/loaders/get-interview-questions";
import type { SimpleMessage } from "../../../shared/types";

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
  totalQuestions: number;
}

/**
 * インタビュー質問の型
 */
export type InterviewQuestion = Awaited<
  ReturnType<typeof getInterviewQuestions>
>[number];

/**
 * DBメッセージの型
 */
export interface DbMessage {
  id: string;
  interview_session_id: string;
  role: "assistant" | "user";
  content: string;
  created_at: string;
}

/**
 * ファシリテーター用パラメータ
 */
export interface FacilitatorParams {
  messages: SimpleMessage[];
  currentStage: "chat" | "summary" | "summary_complete";
  questions: InterviewQuestion[];
  askedQuestionIds: Set<string>;
  dbMessages: DbMessage[];
  totalQuestions: number;
  completedQuestions: number;
  remainingQuestions: number;
}

/**
 * ファシリテーター結果の型
 */
export interface FacilitatorResult {
  nextStage: "chat" | "summary" | "summary_complete";
  source: "algorithm" | "llm";
}

/**
 * 次の質問ID算出用パラメータ
 */
export interface NextQuestionParams {
  messages: Array<{ role: string; content: string }>;
  questions: InterviewQuestion[];
}

/**
 * shouldFacilitate 判定用パラメータ
 */
export interface ShouldFacilitateParams {
  currentStage: "chat" | "summary" | "summary_complete";
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

  /**
   * インタビューの進行を判定
   * @returns nextStageとsourceを含む結果。アルゴリズムで判定できる場合はsource: "algorithm"
   *          LLMによる判定が必要な場合はnullを返し、呼び出し元でLLMを呼び出す
   */
  checkProgress(params: FacilitatorParams): FacilitatorResult | null;

  /**
   * ファシリテーター用のプロンプトを構築
   */
  buildFacilitatorPrompt(params: FacilitatorParams): string;

  /**
   * ファシリテーション処理を実行すべきかどうかを判定
   * @returns true の場合、バックエンドでファシリテーションを実行する
   */
  shouldFacilitate(params: ShouldFacilitateParams): boolean;
}
