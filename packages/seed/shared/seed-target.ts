/**
 * seed の接続先（SUPABASE_URL）を検証するための純粋関数群。
 *
 * seed は既存データを全削除してから投入するため、誤って staging / production を
 * 向いた .env で実行すると実データが消える。ここで接続先がローカル Supabase で
 * あることを確認し、そうでなければ明示的なオプトインが無い限り拒否する。
 */

/** リモート環境への seed を明示的に許可する環境変数名 */
export const SEED_ALLOW_REMOTE_ENV = "SEED_ALLOW_REMOTE";

/**
 * SUPABASE_URL がローカルの Supabase を指しているかを判定する。
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
 * SEED_ALLOW_REMOTE の値がオプトインを表すかを判定する（"1" / "true" のみ許可）。
 */
export function isSeedAllowRemote(rawValue: string | undefined): boolean {
  if (!rawValue) return false;
  const normalized = rawValue.trim().toLowerCase();
  return normalized === "1" || normalized === "true";
}

export type SeedTargetEnv = {
  supabaseUrl: string | undefined;
  allowRemote: string | undefined;
};

/**
 * この接続先に対して seed（全テーブル削除を含む）を実行してよいかを判定する。
 * 実行してよければ null を、拒否する場合はその理由を返す。
 */
export function getSeedTargetRejection({
  supabaseUrl,
  allowRemote,
}: SeedTargetEnv): string | null {
  if (isLocalSupabaseUrl(supabaseUrl)) return null;
  if (isSeedAllowRemote(allowRemote)) return null;

  return [
    `Refusing to seed: SUPABASE_URL (${supabaseUrl ?? "unset"}) is not a local Supabase instance.`,
    "Seeding deletes all existing rows in the target tables before inserting.",
    `Set ${SEED_ALLOW_REMOTE_ENV}=1 only if you intend to run it against a remote environment.`,
  ].join(" ");
}

/**
 * 接続先が許可されていなければ例外を投げる。
 */
export function assertSeedTargetAllowed(env: SeedTargetEnv): void {
  const rejection = getSeedTargetRejection(env);
  if (rejection) {
    throw new Error(rejection);
  }
}
