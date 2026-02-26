/**
 * TTS の rate パラメータ（例: "-20%", "+30%", "1.5"）を
 * Web Speech API の playbackRate 数値に変換する。
 * パースに失敗した場合は 1.0（等速）を返す。
 */
export function parseRate(rate?: string): number {
  if (!rate) return 1.0;
  const trimmed = rate.trim();
  if (trimmed.endsWith("%")) {
    const pct = Number.parseFloat(trimmed.slice(0, -1));
    return Number.isNaN(pct) ? 1.0 : 1.0 + pct / 100;
  }
  const num = Number.parseFloat(trimmed);
  return Number.isNaN(num) ? 1.0 : num;
}
