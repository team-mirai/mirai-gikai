import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Supabaseセッションをミドルウェアでリフレッシュする
 *
 * Server Componentが実行される前にアクセストークンをリフレッシュし、
 * レスポンスcookieに書き戻すことで、サーバー側での認証切れを防ぐ。
 * これがないと匿名ユーザーのトークン期限切れ時にセッションが失われる。
 */
export async function refreshSupabaseSession(
  request: NextRequest
): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser()を呼ぶことでトークンリフレッシュがトリガーされる
  await supabase.auth.getUser();

  return response;
}
