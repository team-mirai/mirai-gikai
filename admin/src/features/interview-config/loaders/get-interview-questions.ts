import { createAdminClient } from "@mirai-gikai/supabase";
import type { InterviewQuestion } from "../types";

export async function getInterviewQuestions(
  interviewConfigId: string
): Promise<InterviewQuestion[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("interview_questions")
    .select("*")
    .eq("interview_config_id", interviewConfigId)
    .order("question_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch interview questions:", error);
    return [];
  }

  return data || [];
}
