"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
import { verifySessionOwnership } from "@/features/interview-session/server/utils/verify-session-ownership";

interface UpdatePublicSettingResult {
  success: boolean;
  error?: string;
}

/**
 * インタビューセッションの公開設定を更新する
 */
export async function updatePublicSetting(
  sessionId: string,
  isPublic: boolean
): Promise<UpdatePublicSettingResult> {
  const ownershipResult = await verifySessionOwnership(sessionId);

  if (!ownershipResult.authorized) {
    return { success: false, error: ownershipResult.error };
  }

  const supabase = createAdminClient();

  const { error: updateError } = await supabase
    .from("interview_sessions")
    .update({ is_public_by_user: isPublic })
    .eq("id", sessionId);

  if (updateError) {
    console.error("Failed to update public setting:", updateError);
    return { success: false, error: "公開設定の更新に失敗しました" };
  }

  return { success: true };
}
