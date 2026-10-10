import "server-only";

import type { ArticleReportCategory } from "@mirai-gikai/shared/article-report/categories";
import { createAdminClient } from "@mirai-gikai/supabase";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";

export async function findBillForArticleReport(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select("id, name, publish_status, article_kind")
    .eq("id", billId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch bill for article report: ${error.message}`
    );
  }
  return data;
}

export async function createArticleReport(params: {
  billId: string;
  difficultyLevel: DifficultyLevelEnum;
  category: ArticleReportCategory | null;
  body: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bill_article_reports")
    .insert({
      bill_id: params.billId,
      difficulty_level: params.difficultyLevel,
      category: params.category,
      body: params.body,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create article report: ${error.message}`);
  }
  return data;
}
