import "server-only";

import {
  convertToModelMessages,
  type LanguageModel,
  Output,
  streamText,
} from "ai";
import { getBillByIdAdmin } from "@/features/bills/server/loaders/get-bill-by-id-admin";
import { getInterviewConfigAdmin } from "@/features/interview-config/server/loaders/get-interview-config-admin";
import { getInterviewQuestions } from "@/features/interview-config/server/loaders/get-interview-questions";
import { createInterviewSession } from "@/features/interview-session/server/actions/create-interview-session";
import { getInterviewMessages } from "@/features/interview-session/server/loaders/get-interview-messages";
import { getInterviewSession } from "@/features/interview-session/server/loaders/get-interview-session";
import {
  interviewChatTextSchema,
  interviewChatWithReportSchema,
} from "@/features/interview-session/shared/schemas";
import type { InterviewChatRequestParams } from "@/features/interview-session/shared/types";
import { AI_MODELS, DEFAULT_INTERVIEW_CHAT_MODEL } from "@/lib/ai/models";
import { logger } from "@/lib/logger";
import {
  buildInterviewSystemPrompt,
  buildSummarySystemPrompt,
} from "../utils/build-interview-system-prompt";
import { collectAskedQuestionIds } from "../utils/interview-logic";
import { bulkModeLogic } from "../utils/interview-logic/bulk-mode";
import { loopModeLogic } from "../utils/interview-logic/loop-mode";
import { saveInterviewMessage } from "./save-interview-message";

// モードロジックのマップ
const modeLogicMap = {
  bulk: bulkModeLogic,
  loop: loopModeLogic,
} as const;

/** テスト時にモック注入するための外部依存 */
export type InterviewChatDeps = {
  chatModel?: LanguageModel;
  summaryModel?: LanguageModel;
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
  deps,
}: InterviewChatRequestParams & { deps?: InterviewChatDeps }) {
  // リクエスト単位のトレースID（同一リクエスト内のLLM呼び出しをまとめる）
  const traceId = crypto.randomUUID();

  // インタビュー設定と法案情報を取得
  const [interviewConfig, bill] = await Promise.all([
    getInterviewConfigAdmin(billId),
    getBillByIdAdmin(billId),
  ]);

  if (!interviewConfig) {
    throw new Error("Interview config not found");
  }

  // セッション取得または作成
  const session =
    (await getInterviewSession(interviewConfig.id)) ??
    (await createInterviewSession({ interviewConfigId: interviewConfig.id }));

  // 最新のメッセージを取得
  const lastMessage = messages[messages.length - 1];

  // ユーザーメッセージを保存
  if (lastMessage?.role === "user") {
    const userMessageText = lastMessage.content;

    if (userMessageText.trim()) {
      await saveInterviewMessage({
        sessionId: session.id,
        role: "user",
        content: userMessageText,
        isRetry,
      });
    }
  }

  // 事前定義質問を取得
  const questions = await getInterviewQuestions(interviewConfig.id);

  // モードに応じたロジックを取得（DBの設定を使用）
  const mode = interviewConfig.mode;
  const logic = modeLogicMap[mode] ?? bulkModeLogic;

  // DBから最新を含む全メッセージを取得
  const dbMessages = await getInterviewMessages(session.id);

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

  // システムプロンプトを構築（ステージ遷移ガイダンスを含む）
  const systemPrompt = isSummaryPhase
    ? buildSummarySystemPrompt({ bill, interviewConfig, messages })
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
  isSummaryPhase,
  chatModel,
  summaryModel,
  configChatModel,
  telemetry,
}: {
  systemPrompt: string;
  messages: { role: string; content: string }[];
  sessionId: string;
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
  // summaryフェーズはGemini固定、chatフェーズは設定のモデルを優先
  const model = isSummaryPhase
    ? (summaryModel ?? AI_MODELS.gemini3_flash)
    : (chatModel ?? configChatModel ?? DEFAULT_INTERVIEW_CHAT_MODEL);

  const handleError = (error: unknown) => {
    console.error("LLM generation error:", error);
    throw new Error(
      `LLM generation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  };

  const handleFinish = async (event: { text?: string }) => {
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
  };

  const uiMessages = messages.map((message) => ({
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
