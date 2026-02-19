"use server";

import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";
import type { InterviewSession } from "../../shared/types";
import { createInterviewSessionRecord } from "../repositories/interview-session-repository";

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

  return await createInterviewSessionRecord({
    interviewConfigId,
    userId: user.id,
  });
}
