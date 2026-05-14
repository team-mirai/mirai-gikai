import "server-only";

import type { BillWithContent } from "@/features/bills/shared/types";
import { buildInterviewSystemPrompt } from "@/features/interview-session/server/utils/build-interview-system-prompt";
import { buildSummarySystemPrompt } from "@/features/interview-session/shared/utils/build-summary-system-prompt";
import type { InterviewConfig } from "./get-interview-config";
import { getInterviewQuestions } from "./get-interview-questions";

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

  const systemPrompt = buildInterviewSystemPrompt({
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
