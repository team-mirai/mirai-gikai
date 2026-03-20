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

const chatDailyUserCostLimitUsdRaw =
  process.env.CHAT_DAILY_USER_COST_LIMIT_USD ||
  process.env.CHAT_DAILY_COST_LIMIT_USD ||
  "0.5";

const chatDailyUserCostLimitUsd = Number(chatDailyUserCostLimitUsdRaw);

if (Number.isNaN(chatDailyUserCostLimitUsd) || chatDailyUserCostLimitUsd <= 0) {
  throw new Error(
    "環境変数 CHAT_DAILY_USER_COST_LIMIT_USD は正の数値で指定してください"
  );
}

const chatDailyTotalCostLimitUsdRaw =
  process.env.CHAT_DAILY_TOTAL_COST_LIMIT_USD || "50";

const chatDailyTotalCostLimitUsd = Number(chatDailyTotalCostLimitUsdRaw);

if (
  Number.isNaN(chatDailyTotalCostLimitUsd) ||
  chatDailyTotalCostLimitUsd <= 0
) {
  throw new Error(
    "環境変数 CHAT_DAILY_TOTAL_COST_LIMIT_USD は正の数値で指定してください"
  );
}

export const env = {
  webUrl: process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000",
  adminUrl: process.env.ADMIN_URL || "http://localhost:3001",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  revalidateSecret: process.env.REVALIDATE_SECRET,
  analytics: {
    gaTrackingId: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
  },
  langfuse: {
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
    promptLabel: process.env.LANGFUSE_PROMPT_LABEL || "production",
  },
  chat: {
    dailyUserCostLimitUsd: chatDailyUserCostLimitUsd,
    dailyTotalCostLimitUsd: chatDailyTotalCostLimitUsd,
  },
} as const;

// 型定義
export type Env = typeof env;
