/**
 * 文字列をtrimし、空文字列の場合はnullを返す
 */
export function trimOrNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
