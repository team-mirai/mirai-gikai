import type { Database } from "@mirai-gikai/supabase";

export type InterviewSession =
  Database["public"]["Tables"]["interview_sessions"]["Row"];

export type InterviewReport =
  Database["public"]["Tables"]["interview_report"]["Row"];

export type InterviewMessage =
  Database["public"]["Tables"]["interview_messages"]["Row"];

export type InterviewSessionWithDetails = InterviewSession & {
  message_count: number;
  interview_report: InterviewReport | null;
};

export type InterviewSessionDetail = InterviewSession & {
  interview_report: InterviewReport | null;
  interview_messages: InterviewMessage[];
};

export {
  type SessionStatus,
  getSessionStatus,
} from "../utils/get-session-status";
export { formatDuration } from "../utils/format-duration";
