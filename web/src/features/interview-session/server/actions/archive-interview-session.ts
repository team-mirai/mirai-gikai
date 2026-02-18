"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
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

  const supabase = createAdminClient();

  // アーカイブ実行
  const { error: updateError } = await supabase
    .from("interview_sessions")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (updateError) {
    console.error("Failed to archive interview session:", updateError);
    return { success: false, error: "アーカイブに失敗しました" };
  }

  return { success: true };
}
