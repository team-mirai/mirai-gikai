const DEFAULT_SNIPPET_RADIUS = 40;

/**
 * 検索語の最初の一致箇所を中心に前後 radius 文字を切り出したスニペットを作る。
 * 切り詰めた側には省略記号を付与する。一致しない場合は先頭から radius * 2 文字を返す。
 */
export function buildSnippet(
  content: string,
  query: string,
  radius = DEFAULT_SNIPPET_RADIUS
): string {
  const trimmedQuery = query.trim();
  const matchIndex = trimmedQuery
    ? content.toLowerCase().indexOf(trimmedQuery.toLowerCase())
    : -1;

  if (matchIndex === -1) {
    const head = content.slice(0, radius * 2);
    return head.length < content.length ? `${head}…` : head;
  }

  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(
    content.length,
    matchIndex + trimmedQuery.length + radius
  );
  const prefix = start > 0 ? "…" : "";
  const suffix = end < content.length ? "…" : "";
  return `${prefix}${content.slice(start, end)}${suffix}`;
}
