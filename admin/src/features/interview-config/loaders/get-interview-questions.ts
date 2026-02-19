import type { InterviewQuestion } from "../types";
import { findInterviewQuestionsByConfigId } from "../repositories/interview-config-repository";

export async function getInterviewQuestions(
  interviewConfigId: string
): Promise<InterviewQuestion[]> {
  try {
    return await findInterviewQuestionsByConfigId(interviewConfigId);
  } catch (error) {
    console.error("Failed to fetch interview questions:", error);
    return [];
  }
}
