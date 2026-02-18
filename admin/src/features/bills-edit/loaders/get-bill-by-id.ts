import { createAdminClient } from "@mirai-gikai/supabase";
import type { Bill } from "../types";

export async function getBillById(id: string): Promise<Bill | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to fetch bill:", error);
    return null;
  }

  return data;
}
