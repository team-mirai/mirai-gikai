import "server-only";

import {
  convertToModelMessages,
  type LanguageModel,
  type LanguageModelUsage,
  Output,
  streamText,
} from "ai";
import { getBillByIdAdmin } from "@/features/bills/server/loaders/get-bill-by-id-admin";
import type { BillWithContent } from "@/features/bills/shared/types";
import {
  isWithinDailyCostLimit,
  recordChatUsage,
} from "@/features/chat/server/services/cost-tracker";
import { ChatError, ChatErrorCode } from "@/features/chat/shared/types/errors";
import type { InterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config-admin";
import { getInterviewConfigAdmin } from "@/features/interview-config/server/loaders/get-interview-config-admin";
import { getInterviewQuestions } from "@/features/interview-config/server/loaders/get-interview-questions";
import { createInterviewSession } from "@/features/interview-session/server/actions/create-interview-session";
import { getInterviewMessages } from "@/features/interview-session/server/loaders/get-interview-messages";
import { getInterviewSession } from "@/features/interview-session/server/loaders/get-interview-session";
import {
  interviewChatTextSchema,
  interviewChatWithReportSchema,
} from "@/features/interview-session/shared/schemas";
import type {
  InterviewChatRequestParams,
  InterviewMessage,
  InterviewSession,
} from "@/features/interview-session/shared/types";
import { DEFAULT_INTERVIEW_CHAT_MODEL } from "@/lib/ai/models";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { buildSummaryModelMessages } from "../../shared/utils/build-summary-model-messages";
import { ensureTrailingUserMessage } from "../../shared/utils/ensure-trailing-user-message";
import { mergeMessagesWithIds } from "../../shared/utils/merge-messages-with-ids";
import {
  buildInterviewSystemPrompt,
  buildSummarySystemPrompt,
} from "../utils/build-interview-system-prompt";
import { collectAskedQuestionIds } from "../utils/interview-logic";
import { bulkModeLogic } from "../utils/interview-logic/bulk-mode";
import { loopModeLogic } from "../utils/interview-logic/loop-mode";
import { targetedModeLogic } from "../utils/interview-logic/targeted-mode";
import { saveInterviewMessage } from "./save-interview-message";

// モードロジックのマップ
const modeLogicMap = {
  bulk: bulkModeLogic,
  loop: loopModeLogic,
  targeted: targetedModeLogic,
} as const;

/** テスト時にモック注入するための外部依存 */
export type InterviewChatDeps = {
  chatModel?: LanguageModel;
  summaryModel?: LanguageModel;
  /** テスト時に認証をバイパスするためのセッション取得関数 */
  getSession?: (configId: string) => Promise<InterviewSession | null>;
  /** テスト時に認証をバイパスするためのメッセージ取得関数 */
  getMessages?: (sessionId: string) => Promise<InterviewMessage[]>;
  /** テスト時にcookies依存をバイパスするための法案取得関数 */
  getBill?: (billId: string) => Promise<BillWithContent | null>;
  /** テスト時にnext/cache依存をバイパスするためのインタビュー設定取得関数 */
  getInterviewConfig?: (billId: string) => Promise<InterviewConfig | null>;
};

/**
 * インタビューチャットリクエストを処理してストリーミングレスポンスを返す
 *
 * チャットLLM自身がnext_stageを出力するため、
 * 別途ファシリテーターLLMを呼び出す必要はない。
 */
export async function handleInterviewChatRequest({
  messages,
  billId,
  currentStage,
  isRetry = false,
  userId,
  deps,
}: InterviewChatRequestParams & {
  userId: string;
  deps?: InterviewChatDeps;
}) {
  // リクエスト単位のトレースID（同一リクエスト内のLLM呼び出しをまとめる）
  const traceId = crypto.randomUUID();

  // TTFB短縮のため、互いに依存しないDBアクセスは並列実行する。
  // 日次コスト制限チェック（fail-closed: エラー時もリクエストをブロック）と
  // インタビュー設定・法案情報の取得（テスト時はdeps経由でNext.js依存をバイパス）
  const getInterviewConfigFn =
    deps?.getInterviewConfig ?? getInterviewConfigAdmin;
  const getBillFn = deps?.getBill ?? getBillByIdAdmin;
  const [isWithinLimit, interviewConfig, bill] = await Promise.all([
    isWithinDailyCostLimit(userId, env.chat.dailyUserCostLimitUsd),
    getInterviewConfigFn(billId),
    getBillFn(billId),
  ]);
  if (!isWithinLimit) {
    throw new ChatError(ChatErrorCode.DAILY_COST_LIMIT_REACHED);
  }

  if (!interviewConfig) {
    throw new Error("Interview config not found");
  }

  // 最新のメッセージを取得
  const lastMessage = messages[messages.length - 1];

  // 「セッション取得→ユーザーメッセージ保存→全メッセージ取得」は順序依存があるため
  // チェーンとして実行する（テスト時はdeps経由で認証をバイパス）
  const loadSessionAndMessages = async () => {
    const getSessionFn = deps?.getSession ?? getInterviewSession;
    const getMessagesFn = deps?.getMessages ?? getInterviewMessages;
    const session =
      (await getSessionFn(interviewConfig.id)) ??
      (await createInterviewSession({ interviewConfigId: interviewConfig.id }));

    // ユーザーメッセージを保存（保存後に取得することで dbMessages に最新を含める）
    if (lastMessage?.role === "user" && lastMessage.content.trim()) {
      await saveInterviewMessage({
        sessionId: session.id,
        role: "user",
        content: lastMessage.content,
        isRetry,
      });
    }

    const dbMessages = await getMessagesFn(session.id);
    return { session, dbMessages };
  };

  // 独立した事前定義質問の取得とセッション系チェーンを並列実行
  const [questions, { session, dbMessages }] = await Promise.all([
    getInterviewQuestions(interviewConfig.id),
    loadSessionAndMessages(),
  ]);

  // モードに応じたロジックを取得（DBの設定を使用）
  const mode = interviewConfig.mode;
  const logic = modeLogicMap[mode] ?? bulkModeLogic;

  // 既に聞いた質問IDを収集
  const askedQuestionIds = collectAskedQuestionIds(dbMessages);

  // クライアントから受け取ったステージで判定
  const isSummaryPhase = currentStage === "summary";

  // 次に聞くべき質問を特定（モードに応じてロジックが異なる）
  const effectiveNextQuestionId = logic.calculateNextQuestionId({
    messages: dbMessages,
    questions,
  });

  // 残り目安時間を計算（estimated_durationが設定されている場合のみ）
  const remainingMinutes = interviewConfig.estimated_duration
    ? Math.max(
        0,
        Math.ceil(
          interviewConfig.estimated_duration -
            (Date.now() - new Date(session.started_at).getTime()) / 60000
        )
      )
    : null;

  // summaryフェーズではメッセージにDBのIDをマージ
  const summaryMessages = isSummaryPhase
    ? mergeMessagesWithIds(messages, dbMessages)
    : messages;

  // システムプロンプトを構築（ステージ遷移ガイダンスを含む）
  const systemPrompt = isSummaryPhase
    ? buildSummarySystemPrompt({
        bill,
        interviewConfig,
        messages: summaryMessages,
      })
    : buildInterviewSystemPrompt({
        bill,
        interviewConfig,
        questions,
        nextQuestionId: effectiveNextQuestionId,
        currentStage,
        askedQuestionIds,
        remainingMinutes,
      });

  logger.debug("System Prompt:", systemPrompt);

  // ストリーミングレスポンスを生成（LLMがnext_stageを直接出力）
  return generateStreamingResponse({
    systemPrompt,
    messages,
    sessionId: session.id,
    userId,
    billId,
    isSummaryPhase,
    chatModel: deps?.chatModel,
    summaryModel: deps?.summaryModel,
    configChatModel: interviewConfig.chat_model,
    telemetry: {
      sessionId: session.id,
      billId,
      traceId,
      stage: currentStage,
    },
  });
}

/**
 * ストリーミングレスポンスを生成
 *
 * LLMの出力スキーマにnext_stageが含まれるため、
 * 後からストリームに注入する必要はない。
 */
async function generateStreamingResponse({
  systemPrompt,
  messages,
  sessionId,
  userId,
  billId,
  isSummaryPhase,
  chatModel,
  summaryModel,
  configChatModel,
  telemetry,
}: {
  systemPrompt: string;
  messages: { role: string; content: string }[];
  sessionId: string;
  userId: string;
  billId: string;
  isSummaryPhase: boolean;
  chatModel?: LanguageModel;
  summaryModel?: LanguageModel;
  configChatModel?: string | null;
  telemetry?: {
    sessionId: string;
    billId: string;
    traceId: string;
    stage: string;
  };
}) {
  // summaryフェーズもchatフェーズと同じモデルを使用（インタビューAIとモデルを揃える）
  const model = isSummaryPhase
    ? (summaryModel ?? configChatModel ?? DEFAULT_INTERVIEW_CHAT_MODEL)
    : (chatModel ?? configChatModel ?? DEFAULT_INTERVIEW_CHAT_MODEL);

  const modelName =
    typeof model === "string" ? model : (model.modelId ?? "unknown");

  const handleError = (error: unknown) => {
    console.error("LLM generation error:", error);
    throw new Error(
      `LLM generation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  };

  const handleFinish = async (event: {
    text?: string;
    totalUsage: LanguageModelUsage;
    providerMetadata?: unknown;
  }) => {
    try {
      if (event.text) {
        await saveInterviewMessage({
          sessionId,
          role: "assistant",
          content: event.text,
        });
      }
    } catch (err) {
      console.error("Failed to save interview message:", err);
    }

    // LLM利用コストを記録
    try {
      const providerCost = extractGatewayCost(event);
      await recordChatUsage({
        userId,
        sessionId,
        promptName: isSummaryPhase ? "interview-summary" : "interview-chat",
        model: modelName,
        usage: event.totalUsage,
        costUsd: providerCost,
        metadata: {
          pageType: "interview",
          billId,
          finishReason: null,
          stepCount: 0,
        },
      });
    } catch (usageError) {
      console.error("Failed to record interview usage:", usageError);
    }
  };

  // Anthropic 系などは会話が user メッセージで終わる必要がある。
  // summary フェーズは会話履歴全文をシステムプロンプトに埋め込んでいるため、
  // 入力トークンの二重送信を避けて末尾の user メッセージ1件のみをモデルへ渡す
  // （末尾が assistant の場合はレポート作成を促す合成 user メッセージを補う）。
  // chat フェーズで末尾が assistant の場合は続行を促す user メッセージを補う。
  // いずれの合成メッセージも DB には保存しない。
  const modelMessages = isSummaryPhase
    ? buildSummaryModelMessages(messages)
    : ensureTrailingUserMessage(messages);

  const uiMessages = modelMessages.map((message) => ({
    role: message.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: message.content }],
  }));

  const functionId = isSummaryPhase ? "interview-summary" : "interview-chat";

  const streamParams = {
    model,
    system: systemPrompt,
    messages: await convertToModelMessages(uiMessages),
    onError: handleError,
    onFinish: handleFinish,
    experimental_telemetry: telemetry
      ? {
          isEnabled: true as const,
          functionId,
          metadata: {
            langfuseTraceId: telemetry.traceId,
            sessionId: telemetry.sessionId,
            billId: telemetry.billId,
            stage: telemetry.stage,
          },
        }
      : undefined,
  } as const;

  try {
    let textStream: ReadableStream<string>;

    if (isSummaryPhase) {
      const result = streamText({
        ...streamParams,
        output: Output.object({ schema: interviewChatWithReportSchema }),
      });
      textStream = result.textStream;
    } else {
      const result = streamText({
        ...streamParams,
        output: Output.object({ schema: interviewChatTextSchema }),
      });
      textStream = result.textStream;
    }

    // LLMがnext_stageを直接出力するため、ストリームをそのまま返す
    return new Response(textStream.pipeThrough(new TextEncoderStream()), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    handleError(error);
    throw error;
  }
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
