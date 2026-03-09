import "server-only";

import { updateInterviewSessionArchived } from "../repositories/interview-session-repository";
import {
  verifySessionOwnership,
  type LoaderDeps,
} from "../utils/verify-session-ownership";

export interface ArchiveInterviewSessionResult {
  success: boolean;
  error?: string;
}

/**
 * インタビューセッションをアーカイブするコアロジック
 * テストからはDIで認証を差し替え可能
 */
export async function archiveInterviewSessionCore(
  sessionId: string,
  deps?: LoaderDeps
): Promise<ArchiveInterviewSessionResult> {
  const ownershipResult = await verifySessionOwnership(sessionId, deps);

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
