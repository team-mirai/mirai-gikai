import type { InterviewStatistics } from "../types";

type RawStatistics = {
  total_sessions: number;
  completed_sessions: number;
  avg_rating: number | null;
  stance_for_count: number;
  stance_against_count: number;
  stance_neutral_count: number;
  avg_total_score: number | null;
  role_subject_expert_count: number;
  role_work_related_count: number;
  role_daily_life_affected_count: number;
  role_general_citizen_count: number;
  avg_message_count: number | null;
  avg_duration_seconds: number | null;
  public_by_user_count: number;
};

export function mapInterviewStatistics(
  raw: RawStatistics
): InterviewStatistics {
  const total = raw.total_sessions;
  return {
    totalSessions: total,
    completedSessions: raw.completed_sessions,
    completionRate: total > 0 ? (raw.completed_sessions / total) * 100 : 0,
    avgRating: raw.avg_rating,
    stanceFor: raw.stance_for_count,
    stanceAgainst: raw.stance_against_count,
    stanceNeutral: raw.stance_neutral_count,
    avgTotalScore: raw.avg_total_score,
    roleSubjectExpert: raw.role_subject_expert_count,
    roleWorkRelated: raw.role_work_related_count,
    roleDailyLifeAffected: raw.role_daily_life_affected_count,
    roleGeneralCitizen: raw.role_general_citizen_count,
    avgMessageCount: raw.avg_message_count,
    avgDurationSeconds: raw.avg_duration_seconds,
    publicByUserCount: raw.public_by_user_count,
    publicRate: total > 0 ? (raw.public_by_user_count / total) * 100 : 0,
  };
}
