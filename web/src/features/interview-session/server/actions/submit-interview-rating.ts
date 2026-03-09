"use server";

import { updateInterviewSessionRating } from "../repositories/interview-session-repository";
import { verifySessionOwnership } from "../utils/verify-session-ownership";

interface SubmitInterviewRatingResult {
  success: boolean;
  error?: string;
}

/**
 * インタビューセッションの星評価（1〜5）を保存する
 */
export async function submitInterviewRating(
  sessionId: string,
  rating: number
): Promise<SubmitInterviewRatingResult> {
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5" };
  }

  const ownershipResult = await verifySessionOwnership(sessionId);
  if (!ownershipResult.authorized) {
    return { success: false, error: ownershipResult.error };
  }

  try {
    await updateInterviewSessionRating(sessionId, Math.round(rating));
  } catch (error) {
    console.error("Failed to save interview rating:", error);
    return { success: false, error: "評価の保存に失敗しました" };
  }

  return { success: true };
}
