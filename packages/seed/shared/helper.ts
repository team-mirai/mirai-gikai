import type { Database } from "@mirai-gikai/supabase";
import { createClient } from "@supabase/supabase-js";
import {
  assertSeedTargetAllowed,
  isLocalSupabaseUrl,
  SEED_ALLOW_REMOTE_ENV,
} from "./seed-target";

export type AdminClient = ReturnType<typeof createAdminClient>;

export function createAdminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
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

type TableToClear = (typeof TABLES_TO_CLEAR)[number];

/**
 * PostgREST の delete は WHERE 句が必須のため、全行にマッチするダミー条件で削除する。
 * 多くのテーブルは uuid の `id` 列を持つが、`bills_tags` は複合主キー
 * (bill_id, tag_id) で `id` 列が無いため、フィルタ列を個別に指定する。
 */
const DELETE_FILTER_COLUMN: Partial<Record<TableToClear, string>> = {
  bills_tags: "bill_id",
};

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * seed 対象テーブルの既存データをすべて削除する。
 *
 * 接続先がローカル Supabase でない場合は、SEED_ALLOW_REMOTE=1 による
 * 明示的なオプトインが無い限り削除前に中断する。
 */
export async function clearAllData(supabase: AdminClient) {
  const supabaseUrl = process.env.SUPABASE_URL;
  assertSeedTargetAllowed({
    supabaseUrl,
    allowRemote: process.env.SEED_ALLOW_REMOTE,
  });
  if (!isLocalSupabaseUrl(supabaseUrl)) {
    // オプトインで通過した場合は、どこを消そうとしているかをログに残す
    console.warn(
      `⚠️  ${SEED_ALLOW_REMOTE_ENV} is set: clearing existing data on remote Supabase (${supabaseUrl})`
    );
  }

  console.log("🧹 Clearing existing data...");

  for (const table of TABLES_TO_CLEAR) {
    const filterColumn = DELETE_FILTER_COLUMN[table] ?? "id";
    const { error } = await supabase
      .from(table)
      .delete()
      .neq(filterColumn, NIL_UUID);

    if (error) {
      throw new Error(`Failed to clear ${table}: ${error.message}`);
    }
  }

  console.log("✅ Cleared existing data");
}
