import "server-only";
import type { Database } from "@mirai-gikai/supabase";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "../env";

export type { User } from "@supabase/supabase-js";

/**
 * サーバーコンポーネント用のSupabaseクライアントを作成
 * Server Components、Route Handlers、Server Actionsで使用
 */
// TODO: authだけで使ってる気がするので、authだけexportする
export async function createAuthClient() {
  const cookieStore = await cookies();

  const serverClient = createServerClient<Database>(
    env.supabaseUrl,
    env.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Componentでは無視
          }
        },
      },
    }
  );

  return serverClient.auth;
}
