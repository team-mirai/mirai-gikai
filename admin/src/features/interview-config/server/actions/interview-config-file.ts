"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import {
  interviewConfigFileName,
  parseInterviewConfigFile,
  serializeInterviewConfigFile,
  toInterviewConfigFile,
} from "../../shared/utils/interview-config-file";
import { normalizePromptOverrides } from "../../shared/utils/normalize-prompt-overrides";
import { prepareQuestionsForInsert } from "../../shared/utils/prepare-questions-for-insert";
import {
  findInterviewConfigById,
  findInterviewQuestionsByConfigId,
} from "../repositories/interview-config-repository";
import { createInterviewConfigWithQuestions } from "../services/create-interview-config-with-questions";

export type ExportInterviewConfigFileResult =
  | { success: true; data: { fileName: string; body: string } }
  | { success: false; error: string };

export type ImportInterviewConfigFileResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

/**
 * 保存済みのインタビュー設定（質問を含む）をファイルの本文にする
 */
export async function exportInterviewConfigFile(
  configId: string
): Promise<ExportInterviewConfigFileResult> {
  try {
    await requireAdmin();

    const [config, questions] = await Promise.all([
      findInterviewConfigById(configId),
      findInterviewQuestionsByConfigId(configId),
    ]);
    if (!config) {
      return {
        success: false,
        error: "書き出すインタビュー設定が見つかりません",
      };
    }

    return {
      success: true,
      data: {
        fileName: interviewConfigFileName(config.name),
        body: serializeInterviewConfigFile(
          toInterviewConfigFile(config, questions, new Date())
        ),
      },
    };
  } catch (error) {
    console.error("Export interview config error:", error);
    return {
      success: false,
      error: getErrorMessage(
        error,
        "インタビュー設定の書き出し中にエラーが発生しました"
      ),
    };
  }
}

/**
 * 書き出したファイルから、指定した法案にインタビュー設定を作る。
 * 複製と同じく非公開で作成する。
 */
export async function importInterviewConfigFile(
  billId: string,
  fileText: string
): Promise<ImportInterviewConfigFileResult> {
  try {
    await requireAdmin();

    const parsed = parseInterviewConfigFile(fileText);
    if (!parsed.success) {
      return { success: false, error: parsed.error };
    }
    const { questions, ...config } = parsed.value;

    const newConfig = await createInterviewConfigWithQuestions(
      {
        ...config,
        bill_id: billId,
        status: "closed",
        prompt_overrides: normalizePromptOverrides(config.prompt_overrides),
      },
      (configId) => prepareQuestionsForInsert(questions, configId)
    );

    await invalidateWebCache([WEB_CACHE_TAGS.INTERVIEW_CONFIGS]);

    return { success: true, data: { id: newConfig.id } };
  } catch (error) {
    console.error("Import interview config error:", error);
    return {
      success: false,
      error: getErrorMessage(
        error,
        "インタビュー設定の読み込み中にエラーが発生しました"
      ),
    };
  }
}
