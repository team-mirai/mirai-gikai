import "server-only";

import { Output, generateText, type LanguageModel } from "ai";
import { getBillByIdAdmin } from "@/features/bills/server/loaders/get-bill-by-id-admin";
import { getInterviewConfigAdmin } from "@/features/interview-config/server/loaders/get-interview-config-admin";
import { getInterviewQuestions } from "@/features/interview-config/server/loaders/get-interview-questions";
import { DEFAULT_INTERVIEW_CHAT_MODEL } from "@/lib/ai/models";
import { interviewChatTextSchema } from "../../shared/schemas";
import type { InterviewMessage } from "../../shared/types";
import { createInterviewMessage } from "../repositories/interview-session-repository";
import { buildInterviewSystemPrompt } from "../utils/build-interview-system-prompt";

type GenerateInitialQuestionParams = {
  sessionId: string;
  billId: string;
  interviewConfigId: string;
  deps?: GenerateQuestionDeps;
};

/** テスト時にモック注入するための外部依存 */
export type GenerateQuestionDeps = {
  model?: LanguageModel;
};

/**
 * インタビューの最初の質問を生成して保存
 */
export async function generateInitialQuestion({
  sessionId,
  billId,
  interviewConfigId,
  deps,
}: GenerateInitialQuestionParams): Promise<InterviewMessage | null> {
  try {
    // インタビュー設定と法案情報を取得
    // どちらもサーバーサイドでの生成処理のため、常にAdmin用（非公開制限なし）を使用する
    const [interviewConfig, bill, questions] = await Promise.all([
      getInterviewConfigAdmin(billId),
      getBillByIdAdmin(billId),
      getInterviewQuestions(interviewConfigId),
    ]);

    if (!interviewConfig) {
      throw new Error("Interview config not found");
    }

    // プロンプトを構築
    const systemPrompt = buildInterviewSystemPrompt({
      bill,
      interviewConfig,
      questions,
    });

    // インタビュー開始の指示を追加（最初の質問にはクイックリプライとquestion_idを含める）
    const firstQuestionId = questions[0]?.id;
    const billTitle = bill?.bill_content?.title ?? bill?.name ?? "この法案";
    const enhancedSystemPrompt = `${systemPrompt}\n\n## 重要: これはインタビューの開始です。ユーザーからのメッセージはありません。事前定義質問の最初の質問から始めてください。挨拶は温かく丁寧に（2文程度）、「${billTitle}」についてのインタビューであることを明確に伝えた上で、すぐに最初の質問をしてください。最初の質問にクイックリプライが設定されている場合は、必ず quick_replies フィールドに含めてください。${firstQuestionId ? `最初の質問は ID: ${firstQuestionId} であり、レスポンスの question_id にこの値を含めてください。` : ""}`;

    // メッセージ履歴なしで最初の質問を生成（構造化出力）
    const model =
      deps?.model ?? interviewConfig.chat_model ?? DEFAULT_INTERVIEW_CHAT_MODEL;
    const result = await generateText({
      model,
      prompt: enhancedSystemPrompt,
      output: Output.object({ schema: interviewChatTextSchema }),
    });

    const generatedText = result.text;

    if (!generatedText?.trim()) {
      console.error("Generated question is empty");
      return null;
    }

    // 生成した質問を保存
    return await createInterviewMessage({
      sessionId,
      role: "assistant",
      content: generatedText,
    });
  } catch (error) {
    console.error("Failed to generate initial question:", error);
    return null;
  }
}
