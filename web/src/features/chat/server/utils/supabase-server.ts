import "server-only";

import type { Database } from "@mirai-gikai/supabase";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/lib/env";

export async function createChatSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Route Handlers cannot mutate cookies; ignore writes.
      },
    },
  });
}

export async function getChatSupabaseUser() {
  const supabase = await createChatSupabaseServerClient();
  return supabase.auth.getUser();
}
