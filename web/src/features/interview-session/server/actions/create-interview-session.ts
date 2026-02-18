"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";
import type { InterviewSession } from "../../shared/types";

export async function createInterviewSession({
  interviewConfigId,
}: {
  interviewConfigId: string;
}): Promise<InterviewSession> {
  // 認可処理
  const {
    data: { user },
    error: getUserError,
  } = await getChatSupabaseUser();

  if (getUserError || !user) {
    throw new Error(
      `Failed to get user: ${getUserError?.message || "User not found"}`
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("interview_sessions")
    .insert({
      interview_config_id: interviewConfigId,
      user_id: user.id,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create interview session: ${error.message}`);
  }

  return data;
}
