import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import { logger } from "@/lib/logger";

interface SaveInterviewMessageParams {
  sessionId: string;
  role: "assistant" | "user";
  content: string;
  isRetry?: boolean;
}

/**
 * インタビューメッセージをDBに保存
 */
export async function saveInterviewMessage({
  sessionId,
  role,
  content,
  isRetry = false,
}: SaveInterviewMessageParams): Promise<void> {
  // リトライ時はユーザーメッセージの保存をスキップ（既に保存済み）
  if (isRetry && role === "user") {
    logger.debug("[Message Save] Skipping user message (retry)");
    return;
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("interview_messages").insert({
    interview_session_id: sessionId,
    role,
    content,
  });

  if (error) {
    console.error("Failed to save interview message:", error);
    throw new Error(`Failed to save interview message: ${error.message}`);
  }
}
