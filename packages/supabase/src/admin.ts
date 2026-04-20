import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase.types";

// Secret key client for server-side operations that bypass RLS
export function createAdminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}
