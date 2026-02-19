import "server-only";

import type { LanguageModelUsage } from "ai";

import {
  calculateUsageCostUsd,
  roundCost,
  type SanitizedUsage,
  sanitizeUsage,
} from "@/lib/ai/calculate-ai-cost";

import {
  type ChatUsageInsert,
  type ChatUsageRow,
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

function parseCost(row: Pick<ChatUsageRow, "cost_usd">): number {
  const value = Number(row.cost_usd);
  return Number.isFinite(value) ? value : 0;
}

function resolveCostUsd(
  model: string,
  usage: SanitizedUsage,
  costOverride?: number | null
): number {
  if (typeof costOverride === "number" && Number.isFinite(costOverride)) {
    return roundCost(costOverride);
  }

  if (usage.inputTokens > 0 || usage.outputTokens > 0) {
    try {
      return calculateUsageCostUsd(model, usage);
    } catch (error) {
      console.error("Failed to calculate usage cost:", error);
    }
  }

  return 0;
}
