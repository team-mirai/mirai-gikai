"use server";

import {
  FEEDBACK_TAGS,
  type FeedbackTag,
} from "../../shared/constants/feedback-tags";
import { insertInterviewRatingFeedbacks } from "../repositories/interview-session-repository";
import { verifySessionOwnership } from "../utils/verify-session-ownership";

interface SubmitInterviewFeedbackResult {
  success: boolean;
  error?: string;
}

/**
 * 低評価時のフィードバックタグ（複数選択可）を保存する
 */
export async function submitInterviewFeedback(
  sessionId: string,
  tags: FeedbackTag[]
): Promise<SubmitInterviewFeedbackResult> {
  if (!Array.isArray(tags) || tags.length === 0) {
    return { success: false, error: "少なくとも1つのタグを選択してください" };
  }

  const invalidTags = tags.filter(
    (t) => !(FEEDBACK_TAGS as readonly string[]).includes(t)
  );
  if (invalidTags.length > 0) {
    return { success: false, error: "無効なタグが含まれています" };
  }

  const ownershipResult = await verifySessionOwnership(sessionId);
  if (!ownershipResult.authorized) {
    return { success: false, error: ownershipResult.error };
  }

  try {
    await insertInterviewRatingFeedbacks(sessionId, tags);
  } catch (error) {
    console.error("Failed to save interview feedback:", error);
    return { success: false, error: "フィードバックの保存に失敗しました" };
  }

  return { success: true };
}
