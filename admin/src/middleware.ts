import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { checkAdminPermission } from "@/lib/auth/permissions";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // MCP エンドポイントはBearerトークンで独自認証する。Supabase auth の呼び出しを避けるため
  // updateSession() より前にバイパスする。
  // NOTE: `startsWith("/api/mcp")` だと `/api/mcpfoo` も一致するため、境界を意識した比較にする。
  const pathname = request.nextUrl.pathname;
  if (pathname === "/api/mcp" || pathname.startsWith("/api/mcp/")) {
    return NextResponse.next();
  }

  // 意見再抽出バックフィルの run は内部 fetch（Bearer 認証）で自己連鎖するため、
  // Supabase セッションを持たない。ルート側で REVALIDATE_SECRET を検証するので、
  // ここでは middleware のセッション認証をバイパスする（dispatch/status は保護対象のまま）。
  if (pathname === "/api/interview-opinion-backfill/run") {
    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);

  // OAuth コールバックはそのまま通す（Route Handler で処理する）
  if (request.nextUrl.pathname === "/api/auth/callback") {
    return supabaseResponse;
  }

  // ログインページへのアクセスで、既にログイン済みの場合
  if (request.nextUrl.pathname === "/login") {
    if (user && checkAdminPermission(user)) {
      const url = request.nextUrl.clone();
      url.pathname = "/bills";
      return NextResponse.redirect(url);
    }
    // ログインページは常にアクセス可能
    return supabaseResponse;
  }

  // 保護されたルートへのアクセス
  // 未認証の場合
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // admin権限チェック
  if (!checkAdminPermission(user)) {
    // 権限がない場合もログイン画面へ
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
