const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * UUID形式の文字列かを判定する。
 */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
