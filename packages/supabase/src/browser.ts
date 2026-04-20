import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../types/supabase.types";

/**
 * ブラウザ環境用のSupabaseクライアントを作成
 * Client Componentsで使用
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}