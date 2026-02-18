import { createAdminClient } from "@mirai-gikai/supabase";
import type { MiraiStance } from "../types";

export async function getStanceByBillId(
  billId: string
): Promise<MiraiStance | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("mirai_stances")
    .select("*")
    .eq("bill_id", billId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      // スタンスが存在しないエラー以外はログに出力
      console.error("Failed to fetch stance:", error);
    }
    return null;
  }

  return data;
}
