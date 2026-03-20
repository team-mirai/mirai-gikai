import "server-only";

import type { LanguageModelUsage } from "ai";

import { sanitizeUsage } from "@/lib/ai/calculate-ai-cost";
import { parseCost, resolveCostUsd } from "../../shared/utils/cost-utils";
import { getJstDayRange } from "../../shared/utils/jst-day-range";

import {
  type ChatUsageInsert,
  findChatUsageEvents,
  insertChatUsageEvent,
} from "../repositories/chat-usage-repository";

type RecordChatUsageParams = {
  userId: string;
  sessionId?: string;
  promptName?: string;
  model: string;
  usage: LanguageModelUsage;
  occurredAt?: string;
  metadata?: ChatUsageInsert["metadata"];
  costUsd?: number | null;
};

export async function recordChatUsage({
  userId,
  sessionId,
  promptName,
  model,
  usage,
  occurredAt,
  metadata,
  costUsd,
}: RecordChatUsageParams) {
  const sanitizedUsage = sanitizeUsage(usage ?? undefined);
  const costUsdNumber = resolveCostUsd(model, sanitizedUsage, costUsd);
  const payload: ChatUsageInsert = {
    user_id: userId,
    session_id: sessionId ?? null,
    prompt_name: promptName ?? null,
    model,
    input_tokens: sanitizedUsage.inputTokens,
    output_tokens: sanitizedUsage.outputTokens,
    total_tokens: sanitizedUsage.totalTokens,
    cost_usd: costUsdNumber,
    occurred_at: occurredAt,
    metadata: metadata ?? null,
  };

  await insertChatUsageEvent(payload);
}

export async function getUsageCostUsd(
  userId: string,
  fromIso: string,
  toIso: string
): Promise<number> {
  const rows = await findChatUsageEvents(userId, fromIso, toIso);
  return rows.reduce((acc, row) => acc + parseCost(row), 0);
}

/**
 * ユーザーが日次コストリミット内かどうかを判定
 */
export async function isWithinDailyCostLimit(
  userId: string,
  dailyCostLimitUsd: number
): Promise<boolean> {
  const jstDayRange = getJstDayRange();
  const usedCost = await getUsageCostUsd(
    userId,
    jstDayRange.from,
    jstDayRange.to
  );
  return usedCost < dailyCostLimitUsd;
}
