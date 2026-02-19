"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import {
  type InterviewQuestionsInput,
  interviewQuestionsInputSchema,
} from "../../shared/types";
import {
  createInterviewQuestions,
  deleteInterviewQuestionsByConfigId,
} from "../repositories/interview-config-repository";
import { prepareQuestionsForInsert } from "../../shared/utils/prepare-questions-for-insert";

export type SaveInterviewQuestionsResult =
  | { success: true }
  | { success: false; error: string };

export async function saveInterviewQuestions(
  interviewConfigId: string,
  questions: InterviewQuestionsInput
): Promise<SaveInterviewQuestionsResult> {
  try {
    await requireAdmin();

    // バリデーション
    const validatedQuestions = interviewQuestionsInputSchema.parse(questions);

    // 既存の質問を全て削除
    await deleteInterviewQuestionsByConfigId(interviewConfigId);

    // 質問が空の場合はここで終了
    if (validatedQuestions.length === 0) {
      await invalidateWebCache();
      return { success: true };
    }

    // 新しい質問を一括挿入（question_orderは自動採番）
    const questionsToInsert = prepareQuestionsForInsert(
      validatedQuestions,
      interviewConfigId
    );

    await createInterviewQuestions(questionsToInsert);

    // web側のキャッシュを無効化
    await invalidateWebCache();

    return { success: true };
  } catch (error) {
    console.error("Save interview questions error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "質問の保存中にエラーが発生しました",
    };
  }
}
