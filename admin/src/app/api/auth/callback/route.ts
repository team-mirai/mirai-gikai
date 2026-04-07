import type { Database } from "@mirai-gikai/supabase";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { checkAdminPermission } from "@/lib/auth/permissions";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${origin}${routes.login()}?error=missing_code`
    );
  }

  const response = NextResponse.redirect(`${origin}${routes.bills()}`);

  const supabase = createServerClient<Database>(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectWithCookies(
      response,
      `${origin}${routes.login()}?error=auth_error`
    );
  }

  // admin 権限チェック: 権限がなければサインアウトしてログインページにリダイレクト
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !checkAdminPermission(user)) {
    await supabase.auth.signOut();
    return redirectWithCookies(
      response,
      `${origin}${routes.login()}?error=unauthorized`
    );
  }

  return response;
}

/**
 * response に蓄積された Set-Cookie を新しいリダイレクト先に引き継ぐ
 */
function redirectWithCookies(
  source: NextResponse,
  location: string
): NextResponse {
  const redirect = NextResponse.redirect(location);
  for (const cookie of source.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}
