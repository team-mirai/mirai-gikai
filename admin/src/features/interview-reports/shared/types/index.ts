import type { Database } from "@mirai-gikai/supabase";
import type { SortConfig } from "@/lib/sort";

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

export type ReactionCounts = {
  helpful: number;
  hmm: number;
};

export type InterviewSessionDetail = InterviewSession & {
  interview_report: InterviewReport | null;
  interview_messages: InterviewMessage[];
  reaction_counts: ReactionCounts | null;
};

// ソート関連の型定義
export type SessionSortField = "started_at" | "message_count";

export const SESSION_SORT_FIELDS: readonly SessionSortField[] = [
  "started_at",
  "message_count",
] as const;

export type SessionSortConfig = SortConfig<SessionSortField>;

export const DEFAULT_SESSION_SORT: SessionSortConfig = {
  field: "started_at",
  order: "desc",
};

export { formatDuration } from "../utils/format-duration";
export {
  getSessionStatus,
  type SessionStatus,
} from "../utils/get-session-status";
