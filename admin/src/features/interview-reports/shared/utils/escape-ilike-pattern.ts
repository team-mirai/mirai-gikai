/**
 * ilike パターンに埋め込む検索文字列をエスケープする。
 * `%` と `_` はワイルドカード、`\` はエスケープ文字として解釈されるため無効化する。
 */
export function escapeIlikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}
