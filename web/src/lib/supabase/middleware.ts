import type { Database } from "@mirai-gikai/supabase";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * ミドルウェアでSupabaseセッションをリフレッシュする
 * リクエストごとにアクセストークンの有効期限を確認し、
 * 期限切れの場合はリフレッシュトークンで自動更新してcookieに書き戻す
 */
export async function updateSupabaseSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({
            request,
          });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // トークンリフレッシュをトリガーする
  // getUser() はサーバーに問い合わせてトークンの有効性を確認し、
  // 期限切れの場合は自動的にリフレッシュする
  await supabase.auth.getUser();

  return supabaseResponse;
}
