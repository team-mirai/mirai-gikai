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

  // ステージに応じたスキーマを選択
  const schema =
    stage === "theme_proposal" ? themeProposalSchema : questionProposalSchema;

  const uiMessages = messages.map((message) => ({
    role: message.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: message.content }],
  }));

  const result = streamText({
    model: AI_MODELS.gpt4o_mini,
    system: systemPrompt,
    messages: await convertToModelMessages(uiMessages),
    output: Output.object({ schema }),
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
