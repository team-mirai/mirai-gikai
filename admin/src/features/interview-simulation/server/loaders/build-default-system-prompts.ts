import "server-only";

import { buildBulkModeSystemPrompt } from "@mirai-gikai/shared/interview-prompts/bulk-mode";
import { buildLoopModeSystemPrompt } from "@mirai-gikai/shared/interview-prompts/loop-mode";
import type {
  PromptBillInput,
  InterviewConfig as PromptInterviewConfig,
  InterviewQuestion as PromptInterviewQuestion,
} from "@mirai-gikai/shared/interview-prompts/types";

interface BuildDefaultSystemPromptsParams {
  bill: PromptBillInput;
  interviewConfig: PromptInterviewConfig;
  questions: PromptInterviewQuestion[];
  mode: "loop" | "bulk";
}

/**
 * シミュレーション開始時の「現行プロンプト」全文を構築する。
 * UI 上は textarea にこの文字列を初期表示し、ユーザーが改善版を作る。
 */
export function buildDefaultSystemPrompts({
  bill,
  interviewConfig,
  questions,
  mode,
}: BuildDefaultSystemPromptsParams): { currentSystemPrompt: string } {
  const builder =
    mode === "bulk" ? buildBulkModeSystemPrompt : buildLoopModeSystemPrompt;

  const currentSystemPrompt = builder({
    bill,
    interviewConfig,
    questions,
    currentStage: "chat",
    askedQuestionIds: new Set<string>(),
    remainingMinutes: null,
  });

  return { currentSystemPrompt };
}
