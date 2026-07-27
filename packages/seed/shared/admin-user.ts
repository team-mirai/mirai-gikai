import type { AdminClient } from "./helper";

const DEFAULT_ADMIN_EMAIL = "admin@example.com";
const DEFAULT_ADMIN_PASSWORD = "admin123456";

/**
 * SUPABASE_URL がローカルの Supabase を指しているかを判定する。
 * ローカル以外（ホスト環境）では固定パスワードの admin を作らないためのガード。
 */
export function isLocalSupabaseUrl(rawUrl: string | undefined): boolean {
  if (!rawUrl) return false;

  let hostname: string;
  try {
    hostname = new URL(rawUrl).hostname;
  } catch {
    return false;
  }

  // IPv6 リテラルは `[::1]` の形で返るためブラケットを外す
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  // 127.0.0.1.example.com のようなホスト名を誤って local と判定しないよう、
  // IPv4 ループバックは完全一致で判定する
  const isIpv4Loopback = /^127(\.\d{1,3}){3}$/.test(host);
  return host === "localhost" || host === "::1" || isIpv4Loopback;
}

/**
 * ローカル開発用の admin ユーザーを作成する。
 *
 * 固定パスワードのアカウントがホスト環境（Supabase preview ブランチ等）に
 * 作られないよう、接続先が localhost の場合のみ実行する。
 * メールアドレス・パスワードは SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD で上書きできる。
 */
export async function seedLocalAdminUser(
  supabase: AdminClient
): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!isLocalSupabaseUrl(supabaseUrl)) {
    console.log(
      `⏭️  Skipping admin user seeding: SUPABASE_URL (${supabaseUrl ?? "unset"}) is not a local Supabase instance`
    );
    return;
  }

  const email = process.env.SEED_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

  console.log("👤 Creating local admin user...");
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { roles: ["admin"] },
  });

  if (error) {
    // 既に存在する場合（db reset せずに seed を再実行したケース）は正常系
    const alreadyExists =
      error.code === "email_exists" || /already/i.test(error.message);
    if (alreadyExists) {
      console.log(`✅ Admin user already exists: ${email}`);
      return;
    }
    throw new Error(`Failed to create admin user: ${error.message}`);
  }

  console.log(`✅ Created admin user: ${email}`);
}
