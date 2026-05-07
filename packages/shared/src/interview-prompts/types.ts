/**
 * インタビュープロンプト構築用の型定義（純粋関数用）
 *
 * 元々 web/src/features/interview-session/shared/utils/interview-logic/types.ts
 * に存在した型を、admin (シミュレーション機能) と web の双方から利用できるよう
 * @mirai-gikai/shared に切り出したもの。
 *
 * BillWithContent への直接依存を避けるため、プロンプトが参照する最小限のフィールドだけを
 * 持つ構造的サブセット型 PromptBillInput を定義している。BillWithContent は
 * 構造的にこの型を満たすため、既存呼び出し側はそのまま渡せる。
 */

/**
 * インタビュープロンプトが参照する Bill の最小構造
 */
export type PromptBillInput = {
  name?: string | null;
  knowledge_source?: string | null;
  bill_content?: {
    title?: string | null;
    summary?: string | null;
    content?: string | null;
  } | null;
} | null;

/**
 * インタビュー設定の型（純粋関数用）
 */
export type InterviewConfig = {
  themes?: string[] | null;
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
  bill: PromptBillInput;
  interviewConfig: InterviewConfig;
  questions: InterviewQuestion[];
  nextQuestionId?: string;
  currentStage: "chat" | "summary" | "summary_complete";
  askedQuestionIds: Set<string>;
  remainingMinutes?: number | null;
}
