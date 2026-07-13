import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export async function findChatUsageMetrics(params: {
  from?: string;
  to?: string;
  billId?: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_chat_usage_metrics", {
    p_from: params.from,
    p_to: params.to,
    p_bill_id: params.billId,
  });

  if (error) {
    throw new Error(`Failed to fetch chat usage metrics: ${error.message}`);
  }

  return data ?? [];
}
