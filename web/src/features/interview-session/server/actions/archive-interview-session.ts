"use server";

import { updateInterviewSessionArchived } from "../repositories/interview-session-repository";
import { verifySessionOwnership } from "../utils/verify-session-ownership";

interface ArchiveInterviewSessionResult {
  success: boolean;
  error?: string;
}

/**
 * インタビューセッションをアーカイブする
 * アーカイブされたセッションは「やり直し」として扱われ、新しいセッションを開始できる
 */
export async function archiveInterviewSession(
  sessionId: string
): Promise<ArchiveInterviewSessionResult> {
  const ownershipResult = await verifySessionOwnership(sessionId);

  if (!ownershipResult.authorized) {
    return { success: false, error: ownershipResult.error };
  }

  try {
    await updateInterviewSessionArchived(sessionId);
  } catch (error) {
    console.error("Failed to archive interview session:", error);
    return { success: false, error: "アーカイブに失敗しました" };
  }

  return { success: true };
}
