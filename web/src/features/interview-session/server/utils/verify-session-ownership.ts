import "server-only";

import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";
import { findSessionOwnerById } from "../repositories/interview-session-repository";
import { resolveOwnership } from "../../shared/utils/resolve-ownership";

// 型をre-export
export type {
  AuthenticatedUserResult,
  VerifySessionOwnershipResult,
} from "../../shared/utils/resolve-ownership";

/** テスト時にDIで差し替え可能な認証関数の型 */
export type GetUserFn = () => Promise<{
  data: { user: { id: string } | null };
  error: Error | null;
}>;

export type LoaderDeps = {
  getUser?: GetUserFn;
};

/**
 * 認証済みユーザーを取得する共通ユーティリティ
 */
export async function getAuthenticatedUser(deps?: LoaderDeps) {
  const getUser = deps?.getUser ?? getChatSupabaseUser;
  const {
    data: { user },
    error: getUserError,
  } = await getUser();

  if (getUserError || !user) {
    return { authenticated: false as const, error: "認証が必要です" };
  }

  return { authenticated: true as const, userId: user.id };
}

/**
 * セッションの所有者確認を行う共通ユーティリティ
 * - ユーザー認証を確認
 * - セッションの所有者と現在のユーザーが一致するか確認
 */
export async function verifySessionOwnership(
  sessionId: string,
  deps?: LoaderDeps
) {
  const authResult = await getAuthenticatedUser(deps);

  let session: { user_id: string } | null = null;
  try {
    session = await findSessionOwnerById(sessionId);
  } catch {
    // session remains null
  }

  return resolveOwnership(authResult, session);
}

// Re-export from shared
export { isSessionOwner } from "../../shared/utils/ownership-check";
