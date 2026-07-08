/**
 * Format a roleDescription string into an array of lines.
 * Splits by newlines, trims whitespace, and removes empty lines.
 * When there are multiple lines, ensures each starts with "・".
 * A single line is returned as-is without bullet prefix.
 */
export function formatRoleDescriptionLines(text: string): string[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) {
    return lines;
  }

  return lines.map((line) => (line.startsWith("・") ? line : `・${line}`));
}

const jstAnsweredAtFormat = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Tokyo",
});

/**
 * 回答日時を "YYYY.M.D HH:mm"（日本時間）で整形する。
 * null・不正な値のときは空文字を返す。
 */
export function formatAnsweredAt(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = jstAnsweredAtFormat.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")} ${get("hour")}:${get("minute")}`;
}

export interface ParsedOpinion {
  title: string;
  content: string;
  source_message_id?: string | null;
}

/**
 * Parse opinions from an unknown value (typically JSON from DB).
 * Returns a typed array of {title, content, source_message_id} objects,
 * or an empty array if the input is not an array.
 */
export function parseOpinions(opinions: unknown): ParsedOpinion[] {
  if (!Array.isArray(opinions)) {
    return [];
  }
  return opinions as ParsedOpinion[];
}
