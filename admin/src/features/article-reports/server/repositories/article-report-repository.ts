import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export async function findBillNameById(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select("id, name")
    .eq("id", billId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch bill: ${error.message}`);
  }
  return data;
}

export async function findArticleReportsByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bill_article_reports")
    .select("id, difficulty_level, category, body, created_at")
    .eq("bill_id", billId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch article reports: ${error.message}`);
  }
  return data;
}
