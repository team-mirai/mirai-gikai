import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";

export type AuthenticatedUserResult =
  | {
      authenticated: true;
      userId: string;
    }
  | {
      authenticated: false;
      error: string;
    };

/**
 * 認証済みユーザーを取得する共通ユーティリティ
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUserResult> {
  const {
    data: { user },
    error: getUserError,
  } = await getChatSupabaseUser();

  if (getUserError || !user) {
    return { authenticated: false, error: "認証が必要です" };
  }

  return { authenticated: true, userId: user.id };
}

export type VerifySessionOwnershipResult =
  | {
      authorized: true;
      userId: string;
    }
  | {
      authorized: false;
      error: string;
    };

/**
 * セッションの所有者確認を行う共通ユーティリティ
 * - ユーザー認証を確認
 * - セッションの所有者と現在のユーザーが一致するか確認
 */
export async function verifySessionOwnership(
  sessionId: string
): Promise<VerifySessionOwnershipResult> {
  const authResult = await getAuthenticatedUser();

  if (!authResult.authenticated) {
    return { authorized: false, error: authResult.error };
  }

  const { userId } = authResult;
  const supabase = createAdminClient();

  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .select("user_id")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return { authorized: false, error: "セッションが見つかりません" };
  }

  if (session.user_id !== userId) {
    return {
      authorized: false,
      error: "このセッションへのアクセス権限がありません",
    };
  }

  return { authorized: true, userId };
}

/**
 * セッションの所有者かどうかをチェックする（既に取得したuser_idと比較）
 */
export function isSessionOwner(
  sessionUserId: string,
  currentUserId: string
): boolean {
  return sessionUserId === currentUserId;
}
