import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/lib/auth-server";
import type { BillContent } from "../types/bill-contents";

export async function getBillContents(billId: string): Promise<BillContent[]> {
  try {
    // 管理者権限チェック
    await requireAdmin();

    // Supabaseから取得
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bill_contents")
      .select("*")
      .eq("bill_id", billId)
      .order("difficulty_level");

    if (error) {
      throw new Error(`議案コンテンツの取得に失敗しました: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Get bill contents error:", error);
    throw error;
  }
}
