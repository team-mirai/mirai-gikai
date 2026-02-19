import "server-only";

import { convertToModelMessages, Output, streamText } from "ai";
import { getBillById } from "@/features/bills-edit/loaders/get-bill-by-id";
import { getBillContents } from "@/features/bills-edit/loaders/get-bill-contents";
import { AI_MODELS } from "@/lib/ai/models";
import { injectJsonFields } from "@/lib/stream/inject-json-fields";
import {
  type ConfigGenerationStage,
  themeProposalSchema,
  questionProposalSchema,
} from "../../shared/schemas";
import { buildConfigGenerationPrompt } from "../utils/build-config-generation-prompt";
import { getInterviewConfigById } from "../../loaders/get-interview-config";

interface HandleConfigGenerationParams {
  messages: Array<{ role: string; content: string }>;
  billId: string;
  configId?: string;
  stage: ConfigGenerationStage;
  confirmedThemes?: string[];
}

export async function handleConfigGeneration({
  messages,
  billId,
  configId,
  stage,
  confirmedThemes,
}: HandleConfigGenerationParams) {
  const [bill, billContents, config] = await Promise.all([
    getBillById(billId),
    getBillContents(billId),
    configId ? getInterviewConfigById(configId) : null,
  ]);

  if (!bill) {
    throw new Error("Bill not found");
  }

  // ふつう（normal）の難易度コンテンツを使用
  const normalContent = billContents.find(
    (c) => c.difficulty_level === "normal"
  );

  const systemPrompt = buildConfigGenerationPrompt({
    billName: bill.name,
    billTitle: normalContent?.title || "",
    billSummary: normalContent?.summary || "",
    billContent: normalContent?.content || "",
    stage,
    confirmedThemes,
    knowledgeSource: config?.knowledge_source || undefined,
  });

  // メッセージが空の場合は初回呼び出し用のユーザーメッセージを追加
  const effectiveMessages =
    messages.length === 0
      ? [
          {
            role: "user" as const,
            content:
              stage === "theme_proposal"
                ? "法案内容を分析して、テーマを提案してください。"
                : "確定したテーマに基づいて、質問を提案してください。",
          },
        ]
      : messages;

  const uiMessages = effectiveMessages.map((message) => ({
    role: message.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: message.content }],
  }));

  const modelMessages = await convertToModelMessages(uiMessages);

  // ステージに応じたスキーマで streamText を実行
  const result =
    stage === "theme_proposal"
      ? streamText({
          model: AI_MODELS.gpt4o_mini,
          system: systemPrompt,
          messages: modelMessages,
          output: Output.object({ schema: themeProposalSchema }),
          onError: (error) => {
            console.error("LLM generation error:", error);
          },
        })
      : streamText({
          model: AI_MODELS.gpt4o_mini,
          system: systemPrompt,
          messages: modelMessages,
          output: Output.object({ schema: questionProposalSchema }),
          onError: (error) => {
            console.error("LLM generation error:", error);
          },
        });

  // ストリームにstageを注入
  const transformedStream = injectJsonFields(result.textStream, {
    stage,
  });

  return new Response(transformedStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
