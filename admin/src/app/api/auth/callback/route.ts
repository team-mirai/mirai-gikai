import { type NextRequest, NextResponse } from "next/server";
import { checkAdminPermission } from "@/lib/auth/permissions";
import { routes } from "@/lib/routes";
import { createAuthClient } from "@/lib/supabase/auth";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${origin}${routes.login()}?error=missing_code`
    );
  }

  const auth = await createAuthClient();
  const { error } = await auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}${routes.login()}?error=auth_error`);
  }

  // admin 権限チェック: 権限がなければサインアウトしてログインページにリダイレクト
  const {
    data: { user },
  } = await auth.getUser();

  if (!user || !checkAdminPermission(user)) {
    await auth.signOut();
    return NextResponse.redirect(
      `${origin}${routes.login()}?error=unauthorized`
    );
  }

  return NextResponse.redirect(`${origin}${routes.bills()}`);
}
