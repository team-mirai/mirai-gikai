import "server-only";

import type { Database } from "@mirai-gikai/supabase";
import { createAdminClient } from "@mirai-gikai/supabase";

type ChatUsageInsert =
  Database["public"]["Tables"]["chat_usage_events"]["Insert"];

type ChatUsageRow = Database["public"]["Tables"]["chat_usage_events"]["Row"];

export type { ChatUsageInsert, ChatUsageRow };

export async function insertChatUsageEvent(payload: ChatUsageInsert) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("chat_usage_events").insert(payload);
  if (error) {
    throw new Error(`Failed to record chat usage: ${error.message}`, {
      cause: error,
    });
  }
}

export async function findChatUsageEvents(
  userId: string,
  fromIso: string,
  toIso: string
): Promise<Pick<ChatUsageRow, "cost_usd" | "occurred_at">[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("chat_usage_events")
    .select("cost_usd, occurred_at")
    .eq("user_id", userId)
    .gte("occurred_at", fromIso)
    .lt("occurred_at", toIso);

  if (error) {
    throw new Error(`Failed to fetch chat usage: ${error.message}`, {
      cause: error,
    });
  }

  return data ?? [];
}
