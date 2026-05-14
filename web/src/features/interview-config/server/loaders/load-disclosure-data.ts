import "server-only";

import type { InterviewMode } from "@mirai-gikai/shared/interview-prompts/types";
import type { BillWithContent } from "@/features/bills/shared/types";
import { buildBulkModeSystemPrompt } from "@/features/interview-session/shared/utils/interview-logic/bulk-mode";
import { buildLoopModeSystemPrompt } from "@/features/interview-session/shared/utils/interview-logic/loop-mode";
import { buildTargetedModeSystemPrompt } from "@/features/interview-session/shared/utils/interview-logic/targeted-mode";
import { buildSummarySystemPrompt } from "@/features/interview-session/shared/utils/build-summary-system-prompt";
import type { InterviewConfig } from "./get-interview-config";
import { getInterviewQuestions } from "./get-interview-questions";

const MODE_PROMPT_BUILDERS = {
  bulk: buildBulkModeSystemPrompt,
  loop: buildLoopModeSystemPrompt,
  targeted: buildTargetedModeSystemPrompt,
} as const satisfies Record<InterviewMode, unknown>;

export interface DisclosureData {
  billId: string;
  billName: string;
  interviewConfig: InterviewConfig;
  systemPrompt: string;
  summaryPrompt: string;
}

export async function loadDisclosureData(
  bill: BillWithContent,
  interviewConfig: NonNullable<InterviewConfig>
): Promise<DisclosureData> {
  const questions = await getInterviewQuestions(interviewConfig.id);

  const mode: InterviewMode = interviewConfig.mode ?? "loop";
  const buildSystemPrompt = MODE_PROMPT_BUILDERS[mode];

  const systemPrompt = buildSystemPrompt({
    bill,
    interviewConfig,
    questions,
    currentStage: "chat",
    askedQuestionIds: new Set(),
    remainingMinutes: null,
  });

  const summaryPrompt = buildSummarySystemPrompt({
    bill,
    interviewConfig,
    messages: [],
  });

  return {
    billId: bill.id,
    billName: bill.name,
    interviewConfig,
    systemPrompt,
    summaryPrompt,
  };
}
