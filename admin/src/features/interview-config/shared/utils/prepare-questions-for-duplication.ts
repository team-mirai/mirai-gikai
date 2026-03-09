import type { InterviewQuestion } from "../types";

/**
 * 質問配列から複製用のデータを生成する
 * 新しいconfig_idを設定し、必要なフィールドのみ抽出
 */
export function prepareQuestionsForDuplication(
  questions: InterviewQuestion[],
  newConfigId: string
) {
  return questions.map((q) => ({
    interview_config_id: newConfigId,
    question: q.question,
    follow_up_guide: q.follow_up_guide,
    quick_replies: q.quick_replies,
    question_order: q.question_order,
  }));
}
