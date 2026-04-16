export type SortOrder = "recommended" | "newest";

export const sortOrderLabels: Record<SortOrder, string> = {
  recommended: "標準",
  newest: "新着順",
};

export const sortOrderOptions: SortOrder[] = ["recommended", "newest"];

const sortOrderSet = new Set<string>(sortOrderOptions);

/**
 * 文字列を SortOrder に変換。無効な値の場合は "recommended" を返す
 */
export function parseSortOrder(value: string | null): SortOrder {
  if (value && sortOrderSet.has(value)) return value as SortOrder;
  return "recommended";
}
