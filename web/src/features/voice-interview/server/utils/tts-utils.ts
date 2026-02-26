/**
 * Edge TTS 向けの純粋ユーティリティ関数群。
 * WebSocket 通信には依存しない。
 */

/** XML の特殊文字をエスケープする */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const VALID_RATE_PATTERN = /^[+-]?\d{1,3}%$/;

/**
 * TTS の rate パラメータを検証する。
 * 有効な形式（例: "+30%", "-20%", "0%"）のみ返し、
 * 無効な場合は undefined を返す。
 */
export function sanitizeRate(rate?: string): string | undefined {
  if (!rate) return undefined;
  if (VALID_RATE_PATTERN.test(rate)) return rate;
  return undefined;
}
