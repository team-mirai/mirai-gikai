import type { InterviewQuestion } from "@/features/interview-session/shared/types";
import { findInterviewQuestionsByConfigId } from "../repositories/interview-config-repository";

export async function getInterviewQuestions(
  interviewConfigId: string
): Promise<InterviewQuestion[]> {
  try {
    const data = await findInterviewQuestionsByConfigId(interviewConfigId);
    return data || [];
  } catch (error) {
    console.error("Failed to fetch interview questions:", error);
    return [];
  }
}
