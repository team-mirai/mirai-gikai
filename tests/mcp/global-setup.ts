import { setup as supabaseSetup } from "../supabase/setup";

export async function setup() {
  await supabaseSetup();
}

export async function teardown() {
  // 共有のクリーンアップは無し
}
