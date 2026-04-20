import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54421";
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

export async function setup() {
  if (!SECRET_KEY) {
    throw new Error(
      "環境変数 SUPABASE_SECRET_KEY が未設定です。ローカル実行時は `.env` をコピーし、`npx supabase status` で値を確認してください。"
    );
  }
  // Supabase 接続確認
  const client = createClient(SUPABASE_URL, SECRET_KEY);
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

  console.log("✓ Supabase 接続確認完了");
}

export async function teardown() {
  // グローバルクリーンアップが必要な場合はここに追加
}
