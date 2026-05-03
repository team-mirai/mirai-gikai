import type { Database } from "@mirai-gikai/supabase";

// Database types
export type InterviewSession =
  Database["public"]["Tables"]["interview_sessions"]["Row"];
export type InterviewSessionInsert =
  Database["public"]["Tables"]["interview_sessions"]["Insert"];
export type InterviewSessionUpdate =
  Database["public"]["Tables"]["interview_sessions"]["Update"];

export type InterviewMessage =
  Database["public"]["Tables"]["interview_messages"]["Row"];
export type InterviewMessageInsert =
  Database["public"]["Tables"]["interview_messages"]["Insert"];

export type InterviewReport =
  Database["public"]["Tables"]["interview_report"]["Row"];
export type InterviewReportInsert =
  Database["public"]["Tables"]["interview_report"]["Insert"];

export type InterviewQuestion =
  Database["public"]["Tables"]["interview_questions"]["Row"];

// Request types
export interface InterviewChatRequestParams {
  messages: Array<{ role: string; content: string }>;
  billId: string;
  currentStage: "chat" | "summary" | "summary_complete";
  isRetry?: boolean;
  nextQuestionId?: string;
  /**
   * プレビューモードで非公開 config を直接指定するときのみ渡す。
   * 通常のユーザー経路では未指定で、サーバー側が公開設定を解決する。
   */
  interviewConfigId?: string;
}
