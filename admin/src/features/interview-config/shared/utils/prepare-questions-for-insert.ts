import type { InterviewQuestionInput } from "../types";

/**
 * バリデーション済み質問配列にconfig_idとquestion_order(1始まり)を付加して
 * DB挿入用のデータに変換する
 */
export function prepareQuestionsForInsert(
  questions: InterviewQuestionInput[],
  interviewConfigId: string
) {
  return questions.map((question, index) => ({
    interview_config_id: interviewConfigId,
    question: question.question,
    instruction: question.instruction || null,
    quick_replies: question.quick_replies || null,
    question_order: index + 1,
  }));
}
