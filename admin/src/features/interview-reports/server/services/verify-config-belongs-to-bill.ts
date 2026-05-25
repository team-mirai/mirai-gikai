import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export async function verifyConfigBelongsToBill(
  configId: string,
  billId: string
): Promise<void> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_configs")
    .select("id")
    .eq("id", configId)
    .eq("bill_id", billId)
    .single();

  if (error || !data) {
    throw new Error("指定されたインタビュー設定はこの議案に属していません");
  }
}
