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
  helpful_count: number;
  interview_report: InterviewReport | null;
};

export type ReactionCounts = {
  helpful: number;
};

export type InterviewSessionDetail = InterviewSession & {
  interview_report: InterviewReport | null;
  interview_messages: InterviewMessage[];
  reaction_counts: ReactionCounts | null;
  feedback_tags: string[];
};

// フィルタ関連の型定義
export type SessionStatusFilter =
  | "all"
  | "completed"
  | "in_progress"
  | "archived";
export type VisibilityFilter = "all" | "public" | "private";
export type StanceFilter = "all" | "for" | "against" | "neutral";
export type RoleFilter =
  | "all"
  | "subject_expert"
  | "work_related"
  | "daily_life_affected"
  | "general_citizen";
export type ModerationFilter = "all" | "ok" | "warning" | "ng" | "unscored";

export interface SessionFilterConfig {
  status: SessionStatusFilter;
  visibility: VisibilityFilter;
  stance: StanceFilter;
  role: RoleFilter;
  moderation: ModerationFilter;
}

export const SESSION_STATUS_FILTER_VALUES: readonly SessionStatusFilter[] = [
  "all",
  "completed",
  "in_progress",
  "archived",
] as const;

export const VISIBILITY_FILTER_VALUES: readonly VisibilityFilter[] = [
  "all",
  "public",
  "private",
] as const;

export const STANCE_FILTER_VALUES: readonly StanceFilter[] = [
  "all",
  "for",
  "against",
  "neutral",
] as const;

export const ROLE_FILTER_VALUES: readonly RoleFilter[] = [
  "all",
  "subject_expert",
  "work_related",
  "daily_life_affected",
  "general_citizen",
] as const;

export const MODERATION_FILTER_VALUES: readonly ModerationFilter[] = [
  "all",
  "ok",
  "warning",
  "ng",
  "unscored",
] as const;

export const DEFAULT_SESSION_FILTER: SessionFilterConfig = {
  status: "completed",
  visibility: "all",
  stance: "all",
  role: "all",
  moderation: "all",
};

export type InterviewStatistics = {
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  avgRating: number | null;
  stanceFor: number;
  stanceAgainst: number;
  stanceNeutral: number;
  avgTotalContentRichness: number | null;
  roleSubjectExpert: number;
  roleWorkRelated: number;
  roleDailyLifeAffected: number;
  roleGeneralCitizen: number;
  avgMessageCount: number | null;
  medianDurationSeconds: number | null;
  publicByUserCount: number;
  publicRate: number;
  feedbackIrrelevantQuestions: number;
  feedbackNotAligned: number;
  feedbackMisunderstood: number;
  feedbackTooManyQuestions: number;
  feedbackOther: number;
};

// ソート関連の型定義
export type SessionSortField =
  | "started_at"
  | "message_count"
  | "total_content_richness"
  | "helpful_count"
  | "moderation_score";

export const SESSION_SORT_FIELDS: readonly SessionSortField[] = [
  "started_at",
  "message_count",
  "total_content_richness",
  "helpful_count",
  "moderation_score",
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
