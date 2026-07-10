import "server-only";

import type { QuestionAnswerCount } from "../../shared/types";
import { mapQuestionAnswerCounts } from "../../shared/utils/map-question-answer-counts";
import { findQuestionAnswerCounts } from "../repositories/interview-report-repository";

export async function getQuestionAnswerCounts(
  configId: string
): Promise<QuestionAnswerCount[]> {
  try {
    const raw = await findQuestionAnswerCounts(configId);
    return mapQuestionAnswerCounts(raw);
  } catch (error) {
    console.error("Failed to fetch question answer counts:", error);
    return [];
  }
}
