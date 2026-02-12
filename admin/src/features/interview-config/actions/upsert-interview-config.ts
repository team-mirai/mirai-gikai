"use server";

import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/lib/auth-server";
import { invalidateWebCache } from "@/lib/utils/cache-invalidation";
import { type InterviewConfigInput, interviewConfigSchema } from "../types";

export type InterviewConfigResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

/**
 * 同じ法案の他の公開設定を非公開にする
 */
async function closeOtherPublicConfigs(
  supabase: ReturnType<typeof createAdminClient>,
  billId: string,
  excludeConfigId?: string
): Promise<void> {
  const query = supabase
    .from("interview_configs")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("bill_id", billId)
    .eq("status", "public");

  if (excludeConfigId) {
    query.neq("id", excludeConfigId);
  }

  await query;
}

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

    const supabase = createAdminClient();

    // 公開設定の場合、既存の公開設定を非公開にする
    if (validatedData.status === "public") {
      await closeOtherPublicConfigs(supabase, billId);
    }

    // 新規作成
    const { data, error } = await supabase
      .from("interview_configs")
      .insert({
        bill_id: billId,
        name: validatedData.name,
        status: validatedData.status,
        mode: validatedData.mode,
        themes: validatedData.themes || null,
        knowledge_source: validatedData.knowledge_source || null,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `インタビュー設定の作成に失敗しました: ${error.message}`,
      };
    }

    // web側のキャッシュを無効化
    await invalidateWebCache();

    return { success: true, data: { id: data.id } };
  } catch (error) {
    console.error("Create interview config error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "インタビュー設定の作成中にエラーが発生しました",
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

    const supabase = createAdminClient();

    // 公開設定の場合、他の公開設定を非公開にする
    if (validatedData.status === "public") {
      // まず現在の設定のbill_idを取得
      const { data: currentConfig, error: fetchError } = await supabase
        .from("interview_configs")
        .select("bill_id")
        .eq("id", configId)
        .single();

      if (fetchError) {
        return {
          success: false,
          error: `インタビュー設定の取得に失敗しました: ${fetchError.message}`,
        };
      }

      await closeOtherPublicConfigs(supabase, currentConfig.bill_id, configId);
    }

    // 更新
    const { data, error } = await supabase
      .from("interview_configs")
      .update({
        name: validatedData.name,
        status: validatedData.status,
        mode: validatedData.mode,
        themes: validatedData.themes || null,
        knowledge_source: validatedData.knowledge_source || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", configId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `インタビュー設定の更新に失敗しました: ${error.message}`,
      };
    }

    // web側のキャッシュを無効化
    await invalidateWebCache();

    return { success: true, data: { id: data.id } };
  } catch (error) {
    console.error("Update interview config error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "インタビュー設定の更新中にエラーが発生しました",
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

    const supabase = createAdminClient();

    // 元の設定を取得
    const { data: originalConfig, error: configError } = await supabase
      .from("interview_configs")
      .select("*")
      .eq("id", configId)
      .single();

    if (configError || !originalConfig) {
      return {
        success: false,
        error: "複製元のインタビュー設定が見つかりません",
      };
    }

    // 元の質問を取得
    const { data: originalQuestions } = await supabase
      .from("interview_questions")
      .select("*")
      .eq("interview_config_id", configId)
      .order("question_order", { ascending: true });

    // 新しい設定を作成（ステータスは非公開で複製）
    const { data: newConfig, error: insertError } = await supabase
      .from("interview_configs")
      .insert({
        bill_id: originalConfig.bill_id,
        name: `${originalConfig.name}（コピー）`,
        status: "closed" as const,
        mode: originalConfig.mode,
        themes: originalConfig.themes,
        knowledge_source: originalConfig.knowledge_source,
      })
      .select()
      .single();

    if (insertError || !newConfig) {
      return {
        success: false,
        error: `インタビュー設定の複製に失敗しました: ${insertError?.message}`,
      };
    }

    // 質問を複製
    if (originalQuestions && originalQuestions.length > 0) {
      const newQuestions = originalQuestions.map((q) => ({
        interview_config_id: newConfig.id,
        question: q.question,
        instruction: q.instruction,
        quick_replies: q.quick_replies,
        question_order: q.question_order,
      }));

      const { error: questionsError } = await supabase
        .from("interview_questions")
        .insert(newQuestions);

      if (questionsError) {
        // 質問の複製に失敗した場合、作成した設定も削除
        await supabase
          .from("interview_configs")
          .delete()
          .eq("id", newConfig.id);
        return {
          success: false,
          error: `質問の複製に失敗しました: ${questionsError.message}`,
        };
      }
    }

    // web側のキャッシュを無効化
    await invalidateWebCache();

    return { success: true, data: { id: newConfig.id } };
  } catch (error) {
    console.error("Duplicate interview config error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "インタビュー設定の複製中にエラーが発生しました",
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

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("interview_configs")
      .delete()
      .eq("id", configId);

    if (error) {
      return {
        success: false,
        error: `インタビュー設定の削除に失敗しました: ${error.message}`,
      };
    }

    // web側のキャッシュを無効化
    await invalidateWebCache();

    return { success: true, data: { id: configId } };
  } catch (error) {
    console.error("Delete interview config error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "インタビュー設定の削除中にエラーが発生しました",
    };
  }
}
