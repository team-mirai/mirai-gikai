"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/features/interview-session/server/utils/verify-session-ownership";
import type { ReactionType } from "../../shared/types";
import {
  deleteReaction,
  findUserReaction,
  isReportPublic,
  upsertReaction,
} from "../repositories/report-reaction-repository";

interface ToggleReactionResult {
  success: boolean;
  error?: string;
  /** トグル後のユーザーのリアクション状態（nullは解除） */
  newReaction: ReactionType | null;
}

/**
 * リアクションをトグルする
 * - 同じリアクションをクリック → 解除（削除）
 * - 別のリアクションをクリック → 切り替え（更新）
 * - リアクションなし → 追加（挿入）
 */
export async function toggleReaction(
  reportId: string,
  reactionType: ReactionType,
  billId?: string
): Promise<ToggleReactionResult> {
  const authResult = await getAuthenticatedUser();
  if (!authResult.authenticated) {
    return {
      success: false,
      error: "認証が必要です",
      newReaction: null,
    };
  }

  const userId = authResult.userId;

  try {
    // レポートが公開されているか確認
    const isPublic = await isReportPublic(reportId);
    if (!isPublic) {
      return {
        success: false,
        error: "公開されていないレポートにはリアクションできません",
        newReaction: null,
      };
    }

    const currentReaction = await findUserReaction(reportId, userId);

    if (currentReaction === reactionType) {
      // 同じリアクション → 解除
      await deleteReaction(reportId, userId);
      revalidatePath(`/report/${reportId}/chat-log`);
      if (billId) {
        revalidatePath(`/bills/${billId}`);
        revalidatePath(`/bills/${billId}/opinions`);
      }
      return { success: true, newReaction: null };
    }

    // 新規 or 切り替え → upsert
    await upsertReaction(reportId, userId, reactionType);
    revalidatePath(`/report/${reportId}/chat-log`);
    if (billId) {
      revalidatePath(`/bills/${billId}`);
      revalidatePath(`/bills/${billId}/opinions`);
    }
    return { success: true, newReaction: reactionType };
  } catch {
    return {
      success: false,
      error: "リアクションの更新に失敗しました",
      newReaction: null,
    };
  }
}
