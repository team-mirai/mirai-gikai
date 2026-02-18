/**
 * ページレイアウトに関するユーティリティ
 *
 * TOPページと法案詳細ページは「メインページ」として扱い、
 * - DifficultySelectorを表示
 * - チャットサイドバー用のオフセットレイアウトを使用
 */

/** メインページ（TOP、法案詳細）かどうかを判定 */
export function isMainPage(pathname: string): boolean {
  // トップページ
  if (pathname === "/") return true;
  // 法案詳細ページ（/bills/[id]）- サブパスは除外
  if (/\/bills\/[^/]+$/.test(pathname)) return true;
  return false;
}

/** インタビューチャットページかどうかを判定 */
export function isInterviewPage(pathname: string): boolean {
  // /bills/[id]/interview/chat
  return /\/bills\/[^/]+\/interview\/chat$/.test(pathname);
}

/** インタビューページからbillIdを抽出 */
export function extractBillIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/bills\/([^/]+)/);
  return match ? match[1] : null;
}
