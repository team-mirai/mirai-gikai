export type AuthenticatedUserResult =
  | {
      authenticated: true;
      userId: string;
    }
  | {
      authenticated: false;
      error: string;
    };

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
 * 認証結果とセッション情報から所有権チェック結果を決定する純粋関数
 */
export function resolveOwnership(
  authResult: AuthenticatedUserResult,
  session: { user_id: string } | null
): VerifySessionOwnershipResult {
  if (!authResult.authenticated) {
    return { authorized: false, error: authResult.error };
  }

  if (!session) {
    return { authorized: false, error: "セッションが見つかりません" };
  }

  if (session.user_id !== authResult.userId) {
    return {
      authorized: false,
      error: "このセッションへのアクセス権限がありません",
    };
  }

  return { authorized: true, userId: authResult.userId };
}
