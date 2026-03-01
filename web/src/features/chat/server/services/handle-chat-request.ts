import { openai } from "@ai-sdk/openai";
import type { Database } from "@mirai-gikai/supabase";
import {
  convertToModelMessages,
  streamText,
  tool,
  type LanguageModel,
  type UIMessage,
} from "ai";
import { z } from "zod";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import type { BillWithContent } from "@/features/bills/shared/types";
import {
  SUGGEST_INTERVIEW_TOOL_NAME,
  SUGGEST_INTERVIEW_TOOL_TYPE,
} from "@/features/chat/shared/constants";
import { ChatError, ChatErrorCode } from "@/features/chat/shared/types/errors";
import { findPublicInterviewConfigByBillId } from "@/features/interview-config/server/repositories/interview-config-repository";
import { findLatestNonArchivedSession } from "@/features/interview-session/server/repositories/interview-session-repository";
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
  hasInterviewConfig?: boolean;
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

  // Determine if interview suggestion should be enabled
  const shouldSuggestInterview = await determineShouldSuggestInterview(
    context,
    messages,
    userId
  );

  // Build system prompt with interview suggestion instructions
  const systemPrompt = buildSystemPromptWithInterviewInstructions(
    promptResult.content,
    shouldSuggestInterview
  );

  // Build tools configuration
  const tools = buildTools(shouldSuggestInterview);

  // Generate streaming response
  try {
    const result = streamText({
      model,
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools,
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
    hasInterviewConfig: metadata?.hasInterviewConfig,
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

const INTERVIEW_SUGGESTION_PROMPT = `

## AIインタビュー提案について
この法案にはAIインタビュー機能があります。以下の条件に該当する場合、通常のテキスト応答と併せて suggest_interview ツールを呼び出してください。
ただし、1つの会話の中で suggest_interview ツールを呼び出すのは1回のみとしてください。

### suggest_interview を呼び出す条件:
- ユーザーがこの法案の当事者や関係者であることがわかった場合
- ユーザーがこの法案について専門的な知識を持っていると判断できる場合
- ユーザーがこの法案に対して具体的な提言や意見を述べた場合
- ユーザーがインタビューや意見提出について質問した場合
- ユーザーが自分の意見を共有したい、政策に反映してほしいと表明した場合

### 重要:
- suggest_interview ツールの呼び出しは、通常のテキスト応答と同時に行ってください。ツールだけを呼び出してテキスト応答を省略しないでください。
- ツールの呼び出しは会話全体で最大1回です。既に呼び出し済みの場合は再度呼び出さないでください。
`;

/**
 * インタビュー提案を有効にすべきか判定
 *
 * 以下のすべてを満たす場合にtrueを返す:
 * - 法案ページである
 * - サーバー側でインタビュー設定が公開状態であることを確認
 * - 会話中にまだsuggest_interviewツールが呼び出されていない
 * - ユーザーがこの法案のインタビューを受けたことがない
 */
async function determineShouldSuggestInterview(
  context: ChatMessageMetadata,
  messages: UIMessage<ChatMessageMetadata>[],
  userId: string
): Promise<boolean> {
  if (!context.billContext) {
    return false;
  }

  if (hasExistingSuggestInterview(messages)) {
    return false;
  }

  // サーバー側でインタビュー設定の存在を検証（クライアント側のメタデータを信頼しない）
  const { data: interviewConfig } = await findPublicInterviewConfigByBillId(
    context.billContext.id
  );
  if (!interviewConfig) {
    return false;
  }

  const hasSession = await hasExistingInterviewSession(
    interviewConfig.id,
    userId
  );
  return !hasSession;
}

/**
 * 会話履歴にsuggest_interviewツール呼び出しが既に存在するか判定
 */
function hasExistingSuggestInterview(
  messages: UIMessage<ChatMessageMetadata>[]
): boolean {
  return messages.some(
    (msg) =>
      msg.role === "assistant" &&
      msg.parts.some(
        (part) =>
          "toolCallId" in part && part.type === SUGGEST_INTERVIEW_TOOL_TYPE
      )
  );
}

/**
 * ユーザーがこのインタビュー設定に対するセッションを持っているか判定
 * fail-closed: エラー時はtrue（セッションあり）を返し、誤ったバナー表示を防ぐ
 */
async function hasExistingInterviewSession(
  interviewConfigId: string,
  userId: string
): Promise<boolean> {
  try {
    const session = await findLatestNonArchivedSession(
      interviewConfigId,
      userId
    );
    return session !== null;
  } catch (error) {
    console.error("Failed to check existing interview session:", error);
    return true;
  }
}

/**
 * インタビュー提案の指示をシステムプロンプトに追加
 */
function buildSystemPromptWithInterviewInstructions(
  basePrompt: string,
  shouldSuggestInterview: boolean
): string {
  if (shouldSuggestInterview) {
    return basePrompt + INTERVIEW_SUGGESTION_PROMPT;
  }
  return basePrompt;
}

/**
 * チャットで使用するツール一覧を構築
 */
function buildTools(shouldSuggestInterview: boolean) {
  // biome-ignore lint/suspicious/noExplicitAny: OpenAI web_search tool type incompatibility
  const tools: Record<string, any> = {
    web_search: openai.tools.webSearch(),
  };

  if (shouldSuggestInterview) {
    tools[SUGGEST_INTERVIEW_TOOL_NAME] = tool({
      description:
        "ユーザーが法案の当事者・有識者であると判断された場合、またはインタビューについて聞かれた場合に呼び出す。通常のテキスト応答と同時に呼び出すこと。",
      inputSchema: z.object({}),
      execute: async () => ({ suggested: true }),
    });
  }

  return tools;
}
