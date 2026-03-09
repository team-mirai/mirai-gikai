import "server-only";

import { logger } from "@/lib/logger";
import { createInterviewMessage } from "../repositories/interview-session-repository";

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

  await createInterviewMessage({ sessionId, role, content });
}
