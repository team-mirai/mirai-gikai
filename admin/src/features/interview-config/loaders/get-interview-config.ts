import { createAdminClient } from "@mirai-gikai/supabase";
import type { InterviewConfig } from "../types";

/**
 * 法案IDからすべてのインタビュー設定を取得する（複数設定対応）
 */
export async function getInterviewConfigs(
  billId: string
): Promise<InterviewConfig[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("interview_configs")
    .select("*")
    .eq("bill_id", billId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch interview configs:", error);
    return [];
  }

  return data || [];
}

/**
 * 設定IDからインタビュー設定を取得する
 */
export async function getInterviewConfigById(
  configId: string
): Promise<InterviewConfig | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("interview_configs")
    .select("*")
    .eq("id", configId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Failed to fetch interview config:", error);
    return null;
  }

  return data;
}
