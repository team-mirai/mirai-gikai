import type { InterviewStatistics } from "../types";

type RawStatistics = {
  total_sessions: number;
  completed_sessions: number;
  avg_rating: number | null;
  stance_for_count: number;
  stance_against_count: number;
  stance_neutral_count: number;
  avg_total_content_richness: number | null;
  role_subject_expert_count: number;
  role_work_related_count: number;
  role_daily_life_affected_count: number;
  role_general_citizen_count: number;
  avg_message_count: number | null;
  median_duration_seconds: number | null;
  public_by_user_count: number;
  feedback_irrelevant_questions: number;
  feedback_not_aligned: number;
  feedback_misunderstood: number;
  feedback_too_many_questions: number;
  feedback_other: number;
  total_cost_usd: number;
  avg_cost_usd: number;
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
    avgTotalContentRichness: raw.avg_total_content_richness,
    roleSubjectExpert: raw.role_subject_expert_count,
    roleWorkRelated: raw.role_work_related_count,
    roleDailyLifeAffected: raw.role_daily_life_affected_count,
    roleGeneralCitizen: raw.role_general_citizen_count,
    avgMessageCount: raw.avg_message_count,
    medianDurationSeconds: raw.median_duration_seconds,
    publicByUserCount: raw.public_by_user_count,
    publicRate:
      raw.completed_sessions > 0
        ? (raw.public_by_user_count / raw.completed_sessions) * 100
        : 0,
    feedbackIrrelevantQuestions: raw.feedback_irrelevant_questions,
    feedbackNotAligned: raw.feedback_not_aligned,
    feedbackMisunderstood: raw.feedback_misunderstood,
    feedbackTooManyQuestions: raw.feedback_too_many_questions,
    feedbackOther: raw.feedback_other,
    totalCostUsd: raw.total_cost_usd,
    avgCostUsd: raw.avg_cost_usd,
  };
}
