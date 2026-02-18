import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { InterviewMessage } from "../../shared/types";
import { verifySessionOwnership } from "../utils/verify-session-ownership";

export async function getInterviewMessages(
  sessionId: string
): Promise<InterviewMessage[]> {
  const ownershipResult = await verifySessionOwnership(sessionId);

  if (!ownershipResult.authorized) {
    console.error(
      "Unauthorized access to interview messages:",
      ownershipResult.error
    );
    return [];
  }

  const supabase = createAdminClient();

  // メッセージを取得
  const { data, error } = await supabase
    .from("interview_messages")
    .select("*")
    .eq("interview_session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch interview messages:", error);
    return [];
  }

  return data || [];
}
