import { createClient } from "@supabase/supabase-js";
import type { Database } from "@mirai-gikai/supabase";

export type AdminClient = ReturnType<typeof createAdminClient>;

export function createAdminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const TABLES_TO_CLEAR = [
  "interview_report",
  "interview_messages",
  "interview_sessions",
  "interview_questions",
  "interview_configs",
  "mirai_stances",
  "chats",
  "bill_contents",
  "bills_tags",
  "bills",
  "tags",
  "diet_sessions",
] as const;

export async function clearAllData(supabase: AdminClient) {
  console.log("🧹 Clearing existing data...");

  for (const table of TABLES_TO_CLEAR) {
    await supabase
      .from(table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
  }

  console.log("✅ Cleared existing data");
}
