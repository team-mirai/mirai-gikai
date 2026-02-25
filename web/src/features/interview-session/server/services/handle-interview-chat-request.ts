import "server-only";

import {
  convertToModelMessages,
  generateText,
  type LanguageModel,
  Output,
  streamText,
} from "ai";
import { z } from "zod";
import { getBillByIdAdmin } from "@/features/bills/server/loaders/get-bill-by-id-admin";
import { getInterviewConfigAdmin } from "@/features/interview-config/server/loaders/get-interview-config-admin";
import { getInterviewQuestions } from "@/features/interview-config/server/loaders/get-interview-questions";
import { createInterviewSession } from "@/features/interview-session/server/actions/create-interview-session";
import { getInterviewMessages } from "@/features/interview-session/server/loaders/get-interview-messages";
import { getInterviewSession } from "@/features/interview-session/server/loaders/get-interview-session";
import {
  type InterviewStage,
  interviewChatTextSchema,
  interviewChatWithReportSchema,
} from "@/features/interview-session/shared/schemas";
import type { InterviewChatRequestParams } from "@/features/interview-session/shared/types";
import { AI_MODELS } from "@/lib/ai/models";
import { logger } from "@/lib/logger";
import { injectJsonFields } from "@/lib/stream/inject-json-fields";
import {
  buildInterviewSystemPrompt,
  buildSummarySystemPrompt,
} from "../utils/build-interview-system-prompt";
import { collectAskedQuestionIds } from "../utils/interview-logic";
import { bulkModeLogic } from "../utils/interview-logic/bulk-mode";
import { loopModeLogic } from "../utils/interview-logic/loop-mode";
import { saveInterviewMessage } from "./save-interview-message";

// ファシリテーター結果のスキーマ
const facilitatorResultSchema = z.object({
  nextStage: z.enum(["chat", "summary", "summary_complete"]),
});

// モードロジックのマップ
const modeLogicMap = {
  bulk: bulkModeLogic,
  loop: loopModeLogic,
} as const;

/** テスト時にモック注入するための外部依存 */
export type InterviewChatDeps = {
  facilitatorModel?: LanguageModel;
  chatModel?: LanguageModel;
  summaryModel?: LanguageModel;
};

/**
 * インタビューチャットリクエストを処理してストリーミングレスポンスを返す
 */
export async function handleInterviewChatRequest({
  messages,
  billId,
  currentStage,
  isRetry = false,
  voice = false,
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

  // ファシリテーション判定を実行（バックエンドでnext_stageを決定）
  const nextStage = await determinNextStage({
    messages,
    currentStage,
    questions,
    dbMessages,
    logic,
    facilitatorModel: deps?.facilitatorModel,
    telemetry: { sessionId: session.id, billId, traceId },
  });

  // 実際に使用するステージ（ファシリテーション結果を反映）
  const effectiveStage = nextStage;
  const isSummaryPhase = effectiveStage === "summary";

  // 次に聞くべき質問を特定（モードに応じてロジックが異なる）
  const effectiveNextQuestionId = logic.calculateNextQuestionId({
    messages: dbMessages,
    questions,
  });

  // システムプロンプトを構築
  let systemPrompt = isSummaryPhase
    ? buildSummarySystemPrompt({ bill, interviewConfig, messages })
    : buildInterviewSystemPrompt({
        bill,
        interviewConfig,
        questions,
        nextQuestionId: effectiveNextQuestionId,
      });

  // 音声モードの場合、システムプロンプトに追加指示を付与
  if (voice && !isSummaryPhase) {
    systemPrompt += buildVoicePromptSuffix(interviewConfig.voice_instruction);
  }

  logger.debug("System Prompt:", systemPrompt);

  // ストリーミングレスポンスを生成（next_stageを注入）
  return generateStreamingResponse({
    systemPrompt,
    messages,
    sessionId: session.id,
    isSummaryPhase,
    nextStage,
    voice,
    chatModel: deps?.chatModel,
    summaryModel: deps?.summaryModel,
    telemetry: {
      sessionId: session.id,
      billId,
      traceId,
      stage: effectiveStage,
    },
  });
}

/**
 * ファシリテーション判定を実行してnext_stageを決定
 */
async function determinNextStage({
  messages,
  currentStage,
  questions,
  dbMessages,
  logic,
  facilitatorModel,
  telemetry,
}: {
  messages: Array<{ role: string; content: string }>;
  currentStage: InterviewStage;
  questions: Awaited<ReturnType<typeof getInterviewQuestions>>;
  dbMessages: Array<{ role: string; content: string }>;
  logic: (typeof modeLogicMap)[keyof typeof modeLogicMap];
  facilitatorModel?: LanguageModel;
  telemetry?: { sessionId: string; billId: string; traceId: string };
}): Promise<InterviewStage> {
  // ファシリテーション不要な場合は現在のステージを維持
  if (!logic.shouldFacilitate({ currentStage })) {
    return currentStage;
  }

  // 既に聞いた質問IDを収集
  const askedQuestionIds = collectAskedQuestionIds(dbMessages);

  // 質問の進捗状況を計算
  const totalQuestions = questions.length;
  const completedQuestions = askedQuestionIds.size;
  const remainingQuestions = totalQuestions - completedQuestions;

  // SimpleMessage形式に変換
  const simpleMessages = messages.map((m) => ({
    role: m.role as "assistant" | "user",
    content: m.content,
  }));

  // ファシリテーターパラメータを構築
  const facilitatorParams = {
    messages: simpleMessages,
    currentStage,
    questions,
    askedQuestionIds,
    dbMessages: dbMessages.map((m) => ({
      id: "",
      interview_session_id: "",
      role: m.role as "assistant" | "user",
      content: m.content,
      created_at: "",
    })),
    totalQuestions,
    completedQuestions,
    remainingQuestions,
  };

  // モード固有のアルゴリズム判定を試みる
  const algorithmResult = logic.checkProgress(facilitatorParams);
  if (algorithmResult) {
    return algorithmResult.nextStage;
  }

  // アルゴリズム判定できなかった場合はLLMで判定
  const facilitatorPrompt = logic.buildFacilitatorPrompt(facilitatorParams);

  const conversationText = simpleMessages
    .map((m) => `${m.role === "assistant" ? "AI" : "User"}: ${m.content}`)
    .join("\n");

  logger.debug("Facilitator Prompt:", facilitatorPrompt);
  const model = facilitatorModel ?? AI_MODELS.gpt4o_mini;
  const result = await generateText({
    model,
    prompt: `${facilitatorPrompt}\n\n# 会話履歴\n${conversationText}`,
    output: Output.object({ schema: facilitatorResultSchema }),
    experimental_telemetry: telemetry
      ? {
          isEnabled: true,
          functionId: "interview-facilitator",
          metadata: {
            langfuseTraceId: telemetry.traceId,
            sessionId: telemetry.sessionId,
            billId: telemetry.billId,
          },
        }
      : undefined,
  });

  return result.output.nextStage;
}

/**
 * ストリーミングレスポンスを生成（next_stageを注入）
 */
// 音声チャット用スキーマ（quick_repliesなし）
const voiceChatTextSchema = z.object({
  text: z.string(),
  question_id: z.string().nullable(),
  topic_title: z.string().nullable(),
});

async function generateStreamingResponse({
  systemPrompt,
  messages,
  sessionId,
  isSummaryPhase,
  nextStage,
  voice = false,
  chatModel,
  summaryModel,
  telemetry,
}: {
  systemPrompt: string;
  messages: { role: string; content: string }[];
  sessionId: string;
  isSummaryPhase: boolean;
  nextStage: InterviewStage;
  voice?: boolean;
  chatModel?: LanguageModel;
  summaryModel?: LanguageModel;
  telemetry?: {
    sessionId: string;
    billId: string;
    traceId: string;
    stage: string;
  };
}) {
  // summaryフェーズはGemini、chatフェーズはGPT-4o-mini
  const model = isSummaryPhase
    ? (summaryModel ?? AI_MODELS.gemini3_flash)
    : (chatModel ?? AI_MODELS.gpt4o_mini);

  const handleError = (error: unknown) => {
    console.error("LLM generation error:", error);
    throw new Error(
      `LLM generation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  };

  const handleFinish = async (event: { text?: string }) => {
    try {
      if (event.text) {
        // event.textは既にJSON文字列（summaryフェーズ）またはプレーンテキスト
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
    } else if (voice) {
      const result = streamText({
        ...streamParams,
        output: Output.object({ schema: voiceChatTextSchema }),
      });
      textStream = result.textStream;
    } else {
      const result = streamText({
        ...streamParams,
        output: Output.object({ schema: interviewChatTextSchema }),
      });
      textStream = result.textStream;
    }

    // ストリームにnext_stageを注入
    const transformedStream = injectJsonFields(textStream, {
      next_stage: nextStage,
    });

    return new Response(transformedStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    handleError(error);
    throw error;
  }
}

/**
 * 音声モード用のシステムプロンプト追加指示を構築
 */
function buildVoicePromptSuffix(
  voiceInstruction: string | null | undefined
): string {
  let suffix = `

## 音声モード指示
このインタビューは音声対話モードで実施されています。以下のルールに従ってください:
- 回答は2〜3文の短い文で簡潔にまとめること（読み上げされるため長すぎると聞き取りづらい）
- 口語体・話し言葉を使うこと（「ですね」「ですか」など自然な会話調）
- quick_replies は出力しないこと
- 箇条書きや記号（「・」「※」「→」など）は使わず、自然な文章で表現すること
- 数字や専門用語は読み上げやすい表現にすること`;

  if (voiceInstruction) {
    suffix += `

## 追加の音声指示
${voiceInstruction}`;
  }

  return suffix;
}
