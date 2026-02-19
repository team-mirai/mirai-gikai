import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54421";
const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54432/postgres";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

export async function setup() {
  // Supabase 接続確認
  const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { error } = await client.from("diet_sessions").select("id").limit(1);
  if (error) {
    throw new Error(
      [
        "Supabase への接続に失敗しました。",
        "ローカル Supabase が起動しているか確認してください: npx supabase start",
        `エラー: ${error.message}`,
      ].join("\n")
    );
  }

  // PostgREST のスキーマキャッシュを更新
  // service_role のみに GRANT された関数（get_admin_users 等）を
  // PostgREST が RPC 経由で呼び出せるようにする
  const { execSync } = await import("node:child_process");
  try {
    execSync(`psql "${DATABASE_URL}" -c "NOTIFY pgrst, 'reload schema'"`, {
      stdio: "pipe",
    });
  } catch {
    // psql が無い環境ではスキップ（CI では supabase start 直後なので不要）
  }

  console.log("✓ Supabase 接続確認完了");
}

export async function teardown() {
  // グローバルクリーンアップが必要な場合はここに追加
}
