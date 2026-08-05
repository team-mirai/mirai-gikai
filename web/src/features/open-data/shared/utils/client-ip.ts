/**
 * リバースプロキシ（Vercel等）越しのクライアントIPを取得する。
 *
 * 前提: Vercel は x-forwarded-for をプロキシで正規化するため先頭の値を
 * 信頼できる。プロキシがヘッダを正規化しない環境ではクライアントが
 * 偽装可能なため、IP単位の制限はベストエフォート（最終防波堤は
 * API全体のレートリミット）。取得できなければ null。
 */
export function getClientIp(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip")?.trim();
  return realIp || null;
}
