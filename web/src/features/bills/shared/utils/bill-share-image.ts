import type { Bill } from "../types";

/**
 * SNSシェア用のOGP画像URLを解決する。
 * 優先順位: share_thumbnail_url（シェア専用画像）> thumbnail_url（表示用画像）> デフォルトOGP。
 * 議案配下のページ（トピック等）も議案の画像を流用するため共通化している。
 */
export function resolveBillShareImageUrl(
  bill: Pick<Bill, "share_thumbnail_url" | "thumbnail_url"> | null | undefined,
  webUrl: string
): string {
  return (
    bill?.share_thumbnail_url ||
    bill?.thumbnail_url ||
    new URL("/ogp.jpg", webUrl).toString()
  );
}
