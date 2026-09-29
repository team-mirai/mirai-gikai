const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * ISO 日時文字列を datetime-local 入力用の日本時間「YYYY-MM-DDTHH:mm」に変換する。
 * null の場合は空文字（未指定）を返す。
 */
export function toJstDateTimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + JST_OFFSET_MS)
    .toISOString()
    .slice(0, 16);
}

/**
 * datetime-local 入力値（日本時間「YYYY-MM-DDTHH:mm」）を
 * タイムゾーン付き ISO 日時文字列に変換する。空文字の場合は null（即時公開）。
 */
export function jstDateTimeLocalToIso(value: string): string | null {
  if (!value) return null;
  return `${value}:00+09:00`;
}

/**
 * フォームの公開日時入力を保存用の値に変換する。
 * 入力が保存済みの値から変更されていなければ保存済みの値をそのまま返し、
 * datetime-local で表現できない秒以下を切り捨てないようにする。
 */
export function resolvePublishAt(
  publishAtLocal: string,
  savedPublishAt: string | null
): string | null {
  if (publishAtLocal === toJstDateTimeLocalValue(savedPublishAt)) {
    return savedPublishAt;
  }
  return jstDateTimeLocalToIso(publishAtLocal);
}
