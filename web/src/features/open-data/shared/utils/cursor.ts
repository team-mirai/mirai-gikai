export type OpenDataCursor = {
  /** ISO 8601 の created_at */
  createdAt: string;
  /** レポートID（UUID） */
  id: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Postgres の timestamptz が受理できる ISO 8601 形式（DBから返る +00:00 形式も含む）
const ISO_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * Date.parse は "2026-02-30" のような実在しない日付を正規化して受理するが、
 * Postgres 側はエラーになるため、月日が実在することまで検証する。
 */
function isValidIsoTimestamp(value: string): boolean {
  const match = ISO_TIMESTAMP_PATTERN.exec(value);
  if (!match) return false;
  if (Number.isNaN(Date.parse(value))) return false;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
  );
}

/**
 * キーセットページネーション用カーソルを不透明な文字列にエンコードする。
 */
export function encodeCursor(cursor: OpenDataCursor): string {
  return Buffer.from(`${cursor.createdAt}|${cursor.id}`, "utf8").toString(
    "base64url"
  );
}

/**
 * カーソル文字列をデコードする。形式が不正な場合は null。
 */
export function decodeCursor(value: string): OpenDataCursor | null {
  let decoded: string;
  try {
    decoded = Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const separatorIndex = decoded.indexOf("|");
  if (separatorIndex < 0) return null;

  const createdAt = decoded.slice(0, separatorIndex);
  const id = decoded.slice(separatorIndex + 1);
  if (!isValidIsoTimestamp(createdAt)) return null;
  if (!UUID_PATTERN.test(id)) return null;

  return { createdAt, id };
}
