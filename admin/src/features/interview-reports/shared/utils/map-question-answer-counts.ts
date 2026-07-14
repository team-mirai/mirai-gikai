import type { Database } from "@mirai-gikai/supabase";
import type { QuestionAnswerCount } from "../types";

type RawQuestionAnswerCount =
  Database["public"]["Functions"]["get_question_answer_counts"]["Returns"][number];

export function mapQuestionAnswerCounts(
  rows: RawQuestionAnswerCount[]
): QuestionAnswerCount[] {
  return rows.map((row) => ({
    questionId: row.question_id,
    question: row.question,
    questionOrder: row.question_order,
    askedSessionCount: row.asked_session_count,
    answeredSessionCount: row.answered_session_count,
  }));
}
