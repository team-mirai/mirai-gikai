export type SortOrder = "recommended" | "newest";

export const sortOrderLabels: Record<SortOrder, string> = {
  recommended: "標準",
  newest: "新着順",
};

export const sortOrderOptions: SortOrder[] = ["recommended", "newest"];
