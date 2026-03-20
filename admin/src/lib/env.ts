/**
 * 環境変数の設定
 * アプリケーション全体で使用する環境変数を一元管理
 */

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("環境変数 NEXT_PUBLIC_SUPABASE_URL が設定されていません");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error(
    "環境変数 NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません"
  );
}

export const env = {
  webUrl: process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  revalidateSecret: process.env.REVALIDATE_SECRET,
  langfuse: {
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
  },
} as const;

// 型定義
export type Env = typeof env;
