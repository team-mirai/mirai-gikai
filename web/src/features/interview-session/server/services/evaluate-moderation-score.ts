import "server-only";

import { generateText, Output, type LanguageModel } from "ai";
import { DEFAULT_INTERVIEW_CHAT_MODEL } from "@/lib/ai/models";
import { moderationResultSchema } from "@mirai-gikai/shared/moderation/schemas";
import { buildModerationPrompt } from "@mirai-gikai/shared/moderation/build-prompt";
import {
  determineModerationStatus,
  type ModerationStatus,
} from "@mirai-gikai/shared/moderation/status";

/** テスト時にモック注入するための外部依存 */
export type ModerationDeps = {
  model?: LanguageModel;
};

type ModerationInput = {
  summary: string | null;
  opinions: Array<{ title: string; content: string }> | null;
  roleDescription: string | null;
  messages: Array<{ role: string; content: string }>;
};

type ModerationOutput = {
  score: number;
  status: ModerationStatus;
  reasoning: string;
};

/**
 * レポート内容のモデレーションスコアを評価する
 */
export async function evaluateModerationScore(
  input: ModerationInput,
  deps?: ModerationDeps
): Promise<ModerationOutput> {
  const prompt = buildModerationPrompt(input);
  const model = deps?.model ?? DEFAULT_INTERVIEW_CHAT_MODEL;

  const { output } = await generateText({
    model,
    output: Output.object({
      schema: moderationResultSchema,
    }),
    prompt,
  });

  const status = determineModerationStatus(output.score);

  console.log(`Moderation result: score=${output.score}, status=${status}`);

  return {
    score: output.score,
    status,
    reasoning: output.reasoning,
  };
}
