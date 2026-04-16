/**
 * インタビューロジック用の型
 *
 * プロンプト構築に必要な型は @mirai-gikai/shared/interview-prompts/types から
 * 再エクスポート。NextQuestionInput は web 固有のため、ここでローカル定義する。
 */
export type {
  InterviewConfig,
  InterviewPromptInput,
  InterviewQuestion,
  PromptBillInput,
} from "@mirai-gikai/shared/interview-prompts/types";

/**
 * 次の質問ID算出用パラメータ（純粋関数用）
 */
export interface NextQuestionInput {
  messages: Array<{ role: string; content: string }>;
  questions: Array<{ id: string }>;
}
