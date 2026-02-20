import type { NextRequest, NextResponse } from "next/server";
import {
  DIFFICULTY_COOKIE_NAME,
  DIFFICULTY_COOKIE_OPTIONS,
  type DifficultyLevelEnum,
  VALID_DIFFICULTY_LEVELS,
} from "./features/bill-difficulty/shared/types";
import {
  createUnauthorizedResponse,
  getBasicAuthConfig,
  isPageSpeedInsights,
  validateBasicAuth,
} from "./lib/basic-auth";
import { refreshSupabaseSession } from "./lib/supabase-middleware";

export async function middleware(request: NextRequest) {
  // Supabaseセッションのリフレッシュ（トークン期限切れ対策）
  const response = await refreshSupabaseSession(request);

  // 難易度Cookie処理
  _handleDifficultyCookie(request, response);

  const authConfig = getBasicAuthConfig();

  // Basic認証の設定がない場合はスキップ
  if (!authConfig) {
    return response;
  }

  // HTML ナビゲーションだけ認証（画像やJSON, css/js, fetch等は通す）
  if (!_isHtmlRequest(request)) return response;

  // PageSpeed Insightsからのアクセスは認証をスキップ
  if (isPageSpeedInsights(request)) {
    return response;
  }

  // Basic認証の検証
  if (validateBasicAuth(request, authConfig)) {
    return response;
  }

  return createUnauthorizedResponse();
}

/**
 * 有効な難易度レベルかチェック
 */
export function isValidDifficultyLevel(
  value: string | null
): value is DifficultyLevelEnum {
  if (!value) return false;
  return VALID_DIFFICULTY_LEVELS.includes(value as DifficultyLevelEnum);
}

/**
 * URLパラメータからdifficultyを取得し、Cookieにセット
 */
function _handleDifficultyCookie(
  request: NextRequest,
  response: NextResponse
): void {
  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get("difficulty");

  // 有効なdifficulty値の場合、Cookieにセット
  if (isValidDifficultyLevel(difficulty)) {
    response.cookies.set(
      DIFFICULTY_COOKIE_NAME,
      difficulty,
      DIFFICULTY_COOKIE_OPTIONS
    );
  }
}

export function isHtmlAcceptHeader(accept: string): boolean {
  return accept.includes("text/html");
}

function _isHtmlRequest(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  return isHtmlAcceptHeader(accept);
}

/**
 * ミドルウェアの対象パスを制限
 * 静的アセット（_next/static, _next/image, favicon, 画像等）を除外し、
 * 不要なSupabaseセッションリフレッシュを防ぐ
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
