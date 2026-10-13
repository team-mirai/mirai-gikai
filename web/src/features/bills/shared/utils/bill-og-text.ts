import type { Bill } from "../types";

const DEFAULT_DESCRIPTION = "議案の詳細情報";

/**
 * 議案詳細ページの OGP のタイトルと説明文を組み立てる。
 * AI自動生成版は、シェア先でもレビュー前の記事であることが伝わる文言にする。
 */
export function buildBillOgText(
  bill: Pick<Bill, "name" | "article_kind">,
  summary: string | null | undefined
): { title: string; description: string } {
  if (bill.article_kind === "ai_generated") {
    return {
      title: `【AI自動生成版】${bill.name}｜みらい議会`,
      description: `AIが作成した解説記事です（人のレビュー前）。${summary ?? ""}`,
    };
  }
  return { title: bill.name, description: summary || DEFAULT_DESCRIPTION };
}
