import { openai } from "@ai-sdk/openai";
import type { Database } from "@mirai-gikai/supabase";
import {
  convertToModelMessages,
  streamText,
  type LanguageModel,
  type UIMessage,
} from "ai";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import type { BillWithContent } from "@/features/bills/shared/types";
import { ChatError, ChatErrorCode } from "@/features/chat/shared/types/errors";
import { env } from "@/lib/env";
import {
  type CompiledPrompt,
  createPromptProvider,
  type PromptProvider,
} from "@/lib/prompt";
import { AI_MODELS } from "@/lib/ai/models";
import { getUsageCostUsd, recordChatUsage } from "./cost-tracker";

export type ChatMessageMetadata = {
  billContext?: BillWithContent;
  pageContext?: {
    type: "home" | "bill";
    bills?: Array<{ id: string; name: string; summary?: string }>;
  };
  difficultyLevel: DifficultyLevelEnum;
  sessionId: string;
};

type ChatRequestParams = {
  messages: UIMessage<ChatMessageMetadata>[];
  userId: string;
  deps?: HandleChatDeps;
};

/** テスト時にモック注入するための外部依存 */
export type HandleChatDeps = {
  promptProvider?: PromptProvider;
  model?: LanguageModel;
};

type ChatUsageMetadata =
  Database["public"]["Tables"]["chat_usage_events"]["Insert"]["metadata"];

/**
 * チャットリクエストを処理してストリーミングレスポンスを返す
 */
export async function handleChatRequest({
  messages,
  userId,
  deps,
}: ChatRequestParams) {
  const promptProvider = deps?.promptProvider ?? createPromptProvider();

  // Extract context from messages
  const context = extractChatContext(messages);

  try {
    // Check cost limit before processing
    const isWithinLimit = await isWithinCostLimit(userId);
    if (!isWithinLimit) {
      throw new ChatError(ChatErrorCode.DAILY_COST_LIMIT_REACHED);
    }
  } catch (error) {
    if (error instanceof ChatError) {
      throw error;
    }
    // コストチェックに失敗した場合はログに記録して続行
    console.error("Cost limit check error:", error);
  }

  // Build prompt configuration
  const { promptName, promptResult } = await buildPrompt(
    context,
    promptProvider
  );
  // Model configuration
  const model = deps?.model ?? AI_MODELS.gpt4o;
  const modelName =
    typeof model === "string" ? model : (model.modelId ?? "unknown");

  // Generate streaming response
  try {
    const result = streamText({
      model,
      system: promptResult.content,
      messages: await convertToModelMessages(messages),
      tools: {
        // biome-ignore lint/suspicious/noExplicitAny: OpenAI web_search tool type incompatibility
        web_search: openai.tools.webSearch() as any,
      },
      onFinish: async (event) => {
        try {
          const providerCost = extractGatewayCost(event);
          await recordChatUsage({
            userId,
            sessionId: context.sessionId || undefined,
            promptName,
            model: modelName,
            usage: event.totalUsage,
            costUsd: providerCost,
            metadata: buildUsageMetadata(context, event),
          });
        } catch (usageError) {
          console.error("Failed to record chat usage:", usageError);
        }
      },
      experimental_telemetry: {
        isEnabled: true,
        functionId: promptName,
        metadata: buildTelemetryMetadata(context, promptResult, userId),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("LLM generation error:", error);
    throw new ChatError(
      ChatErrorCode.LLM_GENERATION_FAILED,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * メッセージから最初のメタデータを抽出してコンテキストを作成
 */
function extractChatContext(
  messages: UIMessage<ChatMessageMetadata>[]
): ChatMessageMetadata {
  const metadata = messages[0]?.metadata;

  return {
    billContext: metadata?.billContext,
    pageContext: metadata?.pageContext,
    difficultyLevel: (metadata?.difficultyLevel ||
      "normal") as DifficultyLevelEnum,
    sessionId: metadata?.sessionId || "",
  };
}

/**
 * ユーザーがコストリミット内かどうかを判定
 */
async function isWithinCostLimit(userId: string): Promise<boolean> {
  const jstDayRange = getJstDayRange();
  const usedCost = await getUsageCostUsd(
    userId,
    jstDayRange.from,
    jstDayRange.to
  );
  const limitCost = env.chat.dailyCostLimitUsd;

  return usedCost < limitCost;
}

/**
 * コンテキストに基づいてプロンプトを組み立てる
 */
async function buildPrompt(
  context: ChatMessageMetadata,
  promptProvider: PromptProvider
) {
  // Determine prompt name
  const promptName =
    context.pageContext?.type === "home"
      ? "top-chat-system"
      : `bill-chat-system-${context.difficultyLevel}`;

  // Prepare prompt variables
  const variables: Record<string, string> =
    context.pageContext?.type === "home"
      ? { billSummary: JSON.stringify(context.pageContext.bills ?? "") }
      : {
          billName: context.billContext?.name ?? "",
          billTitle: context.billContext?.bill_content?.title ?? "",
          billSummary: context.billContext?.bill_content?.summary ?? "",
          billContent: context.billContext?.bill_content?.content ?? "",
        };

  // Fetch prompt from Langfuse
  try {
    const promptResult = await promptProvider.getPrompt(promptName, variables);
    return { promptName, promptResult };
  } catch (error) {
    console.error("Prompt fetch error:", error);
    throw new ChatError(
      ChatErrorCode.PROMPT_FETCH_FAILED,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * JST基準の1日の時間範囲を取得（UTC形式で返す）
 */
function getJstDayRange(): { from: string; to: string } {
  const now = new Date();
  const jstOffsetMs = 9 * 60 * 60 * 1000;
  const jstNow = new Date(now.getTime() + jstOffsetMs);

  const startOfJstDay = new Date(
    Date.UTC(
      jstNow.getUTCFullYear(),
      jstNow.getUTCMonth(),
      jstNow.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );

  const startUtc = new Date(startOfJstDay.getTime() - jstOffsetMs);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);

  return {
    from: startUtc.toISOString(),
    to: endUtc.toISOString(),
  };
}

/**
 * テレメトリメタデータを構築
 */
function buildTelemetryMetadata(
  context: ChatMessageMetadata,
  promptResult: CompiledPrompt,
  userId: string
) {
  return {
    langfusePrompt: promptResult.metadata,
    billId: context.billContext?.id || "",
    pageType: context.pageContext?.type || "bill",
    difficultyLevel: context.difficultyLevel,
    userId,
    sessionId: context.sessionId,
  };
}

function buildUsageMetadata(
  context: ChatMessageMetadata,
  finishEvent: { finishReason?: unknown; steps?: unknown[] }
): ChatUsageMetadata {
  const finishReason =
    typeof finishEvent.finishReason === "string"
      ? finishEvent.finishReason
      : null;
  const stepCount = Array.isArray(finishEvent.steps)
    ? finishEvent.steps.length
    : 0;

  return {
    pageType: context.pageContext?.type ?? null,
    difficultyLevel: context.difficultyLevel,
    billId: context.billContext?.id ?? null,
    finishReason,
    stepCount,
  };
}

function extractGatewayCost(event: {
  providerMetadata?: unknown;
}): number | undefined {
  const providerMetadata = event.providerMetadata;
  if (!providerMetadata || typeof providerMetadata !== "object") {
    return undefined;
  }

  const gatewayCost = (
    providerMetadata as {
      gateway?: { cost?: unknown };
    }
  ).gateway?.cost;

  const numericCost = Number(gatewayCost);

  return Number.isFinite(numericCost) ? numericCost : undefined;
}
