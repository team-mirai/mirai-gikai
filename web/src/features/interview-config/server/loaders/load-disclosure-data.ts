import "server-only";

import type { BillWithContent } from "@/features/bills/shared/types";
import { buildBulkModeSystemPrompt } from "@/features/interview-session/shared/utils/interview-logic/bulk-mode";
import { buildLoopModeSystemPrompt } from "@/features/interview-session/shared/utils/interview-logic/loop-mode";
import { buildSummarySystemPrompt } from "@/features/interview-session/shared/utils/build-summary-system-prompt";
import type { InterviewQuestion } from "@/features/interview-session/shared/types";
import type { InterviewConfig } from "./get-interview-config";
import { getInterviewQuestions } from "./get-interview-questions";

export interface DisclosureData {
  billName: string;
  interviewConfig: InterviewConfig;
  questions: InterviewQuestion[];
  systemPrompt: string;
  summaryPrompt: string;
}

export async function loadDisclosureData(
  bill: BillWithContent,
  interviewConfig: NonNullable<InterviewConfig>
): Promise<DisclosureData> {
  const questions = await getInterviewQuestions(interviewConfig.id);

  const mode = interviewConfig.mode ?? "loop";
  const buildSystemPrompt =
    mode === "bulk" ? buildBulkModeSystemPrompt : buildLoopModeSystemPrompt;

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
    billName: bill.name,
    interviewConfig,
    questions,
    systemPrompt,
    summaryPrompt,
  };
}
