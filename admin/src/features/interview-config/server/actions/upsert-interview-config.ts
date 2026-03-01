"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import {
  type InterviewConfigInput,
  interviewConfigSchema,
} from "../../shared/types";
import { prepareQuestionsForDuplication } from "../../shared/utils/prepare-questions-for-duplication";
import {
  closeOtherPublicConfigs,
  createInterviewConfigRecord,
  createInterviewQuestions,
  deleteInterviewConfigRecord,
  findInterviewConfigBillId,
  findInterviewConfigById,
  findInterviewQuestionsByConfigId,
  updateInterviewConfigRecord,
} from "../repositories/interview-config-repository";

export type InterviewConfigResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

/**
 * 新しいインタビュー設定を作成する
 */
export async function createInterviewConfig(
  billId: string,
  input: InterviewConfigInput
): Promise<InterviewConfigResult> {
  try {
    await requireAdmin();

    // バリデーション
    const validatedData = interviewConfigSchema.parse(input);

    // 公開設定の場合、既存の公開設定を非公開にする
    if (validatedData.status === "public") {
      await closeOtherPublicConfigs(billId);
    }

    // 新規作成
    const data = await createInterviewConfigRecord({
      bill_id: billId,
      name: validatedData.name,
      status: validatedData.status,
      mode: validatedData.mode,
      themes: validatedData.themes || null,
      knowledge_source: validatedData.knowledge_source || null,
      chat_model: validatedData.chat_model || null,
      estimated_duration: validatedData.estimated_duration ?? null,
    });

    // web側のキャッシュを無効化
    await invalidateWebCache([WEB_CACHE_TAGS.INTERVIEW_CONFIGS]);

    return { success: true, data: { id: data.id } };
  } catch (error) {
    console.error("Create interview config error:", error);
    return {
      success: false,
      error: getErrorMessage(
        error,
        "インタビュー設定の作成中にエラーが発生しました"
      ),
    };
  }
}

/**
 * 既存のインタビュー設定を更新する
 */
export async function updateInterviewConfig(
  configId: string,
  input: InterviewConfigInput
): Promise<InterviewConfigResult> {
  try {
    await requireAdmin();

    // バリデーション
    const validatedData = interviewConfigSchema.parse(input);

    // 公開設定の場合、他の公開設定を非公開にする
    if (validatedData.status === "public") {
      // まず現在の設定のbill_idを取得
      const currentConfig = await findInterviewConfigBillId(configId);
      await closeOtherPublicConfigs(currentConfig.bill_id, configId);
    }

    // 更新
    const data = await updateInterviewConfigRecord(configId, {
      name: validatedData.name,
      status: validatedData.status,
      mode: validatedData.mode,
      themes: validatedData.themes || null,
      knowledge_source: validatedData.knowledge_source || null,
      chat_model: validatedData.chat_model || null,
      estimated_duration: validatedData.estimated_duration ?? null,
      updated_at: new Date().toISOString(),
    });

    // web側のキャッシュを無効化
    await invalidateWebCache([WEB_CACHE_TAGS.INTERVIEW_CONFIGS]);

    return { success: true, data: { id: data.id } };
  } catch (error) {
    console.error("Update interview config error:", error);
    return {
      success: false,
      error: getErrorMessage(
        error,
        "インタビュー設定の更新中にエラーが発生しました"
      ),
    };
  }
}

/**
 * インタビュー設定を複製する（質問も含めてコピー）
 */
export async function duplicateInterviewConfig(
  configId: string
): Promise<InterviewConfigResult> {
  try {
    await requireAdmin();

    // 元の設定を取得
    const originalConfig = await findInterviewConfigById(configId);

    if (!originalConfig) {
      return {
        success: false,
        error: "複製元のインタビュー設定が見つかりません",
      };
    }

    // 元の質問を取得
    const originalQuestions = await findInterviewQuestionsByConfigId(configId);

    // 新しい設定を作成（ステータスは非公開で複製）
    let newConfig: { id: string };
    try {
      newConfig = await createInterviewConfigRecord({
        bill_id: originalConfig.bill_id,
        name: `${originalConfig.name}（コピー）`,
        status: "closed" as const,
        mode: originalConfig.mode as "loop" | "bulk",
        themes: originalConfig.themes,
        knowledge_source: originalConfig.knowledge_source,
        chat_model: originalConfig.chat_model,
        estimated_duration: originalConfig.estimated_duration,
      });
    } catch (error) {
      return {
        success: false,
        error: `インタビュー設定の複製に失敗しました: ${getErrorMessage(error, "unknown error")}`,
      };
    }

    // 質問を複製
    if (originalQuestions.length > 0) {
      const newQuestions = prepareQuestionsForDuplication(
        originalQuestions,
        newConfig.id
      );

      try {
        await createInterviewQuestions(newQuestions);
      } catch (error) {
        // 質問の複製に失敗した場合、作成した設定も削除
        await deleteInterviewConfigRecord(newConfig.id);
        return {
          success: false,
          error: `質問の複製に失敗しました: ${getErrorMessage(error, "unknown error")}`,
        };
      }
    }

    // web側のキャッシュを無効化
    await invalidateWebCache([WEB_CACHE_TAGS.INTERVIEW_CONFIGS]);

    return { success: true, data: { id: newConfig.id } };
  } catch (error) {
    console.error("Duplicate interview config error:", error);
    return {
      success: false,
      error: getErrorMessage(
        error,
        "インタビュー設定の複製中にエラーが発生しました"
      ),
    };
  }
}

/**
 * インタビュー設定を削除する
 */
export async function deleteInterviewConfig(
  configId: string
): Promise<InterviewConfigResult> {
  try {
    await requireAdmin();

    await deleteInterviewConfigRecord(configId);

    // web側のキャッシュを無効化
    await invalidateWebCache([WEB_CACHE_TAGS.INTERVIEW_CONFIGS]);

    return { success: true, data: { id: configId } };
  } catch (error) {
    console.error("Delete interview config error:", error);
    return {
      success: false,
      error: getErrorMessage(
        error,
        "インタビュー設定の削除中にエラーが発生しました"
      ),
    };
  }
}
