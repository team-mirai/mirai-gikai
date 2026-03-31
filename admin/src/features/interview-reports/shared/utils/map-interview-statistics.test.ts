import { describe, expect, it } from "vitest";
import { mapInterviewStatistics } from "./map-interview-statistics";

describe("mapInterviewStatistics", () => {
  const baseRaw = {
    total_sessions: 100,
    completed_sessions: 80,
    avg_rating: 4.25,
    stance_for_count: 30,
    stance_against_count: 20,
    stance_neutral_count: 10,
    avg_total_content_richness: 72.5,
    role_subject_expert_count: 10,
    role_work_related_count: 20,
    role_daily_life_affected_count: 15,
    role_general_citizen_count: 35,
    avg_message_count: 12.3,
    median_duration_seconds: 345,
    public_by_user_count: 60,
    feedback_irrelevant_questions: 5,
    feedback_not_aligned: 3,
    feedback_misunderstood: 7,
    feedback_too_many_questions: 2,
    feedback_other: 1,
    total_cost_usd: 12.345678,
    avg_cost_usd: 0.123457,
  };

  it("maps raw DB result to InterviewStatistics", () => {
    const result = mapInterviewStatistics(baseRaw);

    expect(result.totalSessions).toBe(100);
    expect(result.completedSessions).toBe(80);
    expect(result.completionRate).toBe(80);
    expect(result.avgRating).toBe(4.25);
    expect(result.stanceFor).toBe(30);
    expect(result.stanceAgainst).toBe(20);
    expect(result.stanceNeutral).toBe(10);
    expect(result.avgTotalContentRichness).toBe(72.5);
    expect(result.roleSubjectExpert).toBe(10);
    expect(result.roleWorkRelated).toBe(20);
    expect(result.roleDailyLifeAffected).toBe(15);
    expect(result.roleGeneralCitizen).toBe(35);
    expect(result.avgMessageCount).toBe(12.3);
    expect(result.medianDurationSeconds).toBe(345);
    expect(result.publicByUserCount).toBe(60);
    expect(result.publicRate).toBe(75);
    expect(result.feedbackIrrelevantQuestions).toBe(5);
    expect(result.feedbackNotAligned).toBe(3);
    expect(result.feedbackMisunderstood).toBe(7);
    expect(result.feedbackTooManyQuestions).toBe(2);
    expect(result.feedbackOther).toBe(1);
    expect(result.totalCostUsd).toBe(12.345678);
    expect(result.avgCostUsd).toBe(0.123457);
  });

  it("handles zero total sessions", () => {
    const result = mapInterviewStatistics({
      ...baseRaw,
      total_sessions: 0,
      completed_sessions: 0,
      public_by_user_count: 0,
    });

    expect(result.completionRate).toBe(0);
    expect(result.publicRate).toBe(0);
  });

  it("handles zero feedback counts", () => {
    const result = mapInterviewStatistics({
      ...baseRaw,
      feedback_irrelevant_questions: 0,
      feedback_not_aligned: 0,
      feedback_misunderstood: 0,
      feedback_too_many_questions: 0,
      feedback_other: 0,
    });

    expect(result.feedbackIrrelevantQuestions).toBe(0);
    expect(result.feedbackNotAligned).toBe(0);
    expect(result.feedbackMisunderstood).toBe(0);
    expect(result.feedbackTooManyQuestions).toBe(0);
    expect(result.feedbackOther).toBe(0);
  });

  it("handles null averages", () => {
    const result = mapInterviewStatistics({
      ...baseRaw,
      avg_rating: null,
      avg_total_content_richness: null,
      avg_message_count: null,
      median_duration_seconds: null,
    });

    expect(result.avgRating).toBeNull();
    expect(result.avgTotalContentRichness).toBeNull();
    expect(result.avgMessageCount).toBeNull();
    expect(result.medianDurationSeconds).toBeNull();
  });
});
