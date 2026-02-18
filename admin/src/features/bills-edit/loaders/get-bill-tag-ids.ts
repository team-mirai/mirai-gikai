import { createAdminClient } from "@mirai-gikai/supabase";

/**
 * 議案に紐づくタグIDの配列を取得する
 */
export async function getBillTagIds(billId: string): Promise<string[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("bills_tags")
    .select("tag_id")
    .eq("bill_id", billId);

  if (error) {
    throw new Error(`議案のタグ取得に失敗しました: ${error.message}`);
  }

  return data?.map((item) => item.tag_id) || [];
}
