import type { Database } from "@mirai-gikai/supabase";

export type ArticleReportCategory =
  Database["public"]["Enums"]["article_report_category"];

/** 誤り報告の種類（フォームの表示順） */
export const ARTICLE_REPORT_CATEGORIES = [
  "factual_error",
  "outdated",
  "unclear",
  "other",
] as const satisfies readonly ArticleReportCategory[];

export const ARTICLE_REPORT_CATEGORY_LABELS: Record<
  ArticleReportCategory,
  string
> = {
  factual_error: "事実と違う",
  outdated: "情報が古い",
  unclear: "わかりにくい",
  other: "その他",
};
