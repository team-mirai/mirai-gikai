import type { createAdminClient } from "@mirai-gikai/supabase";

type SupabaseClient = ReturnType<typeof createAdminClient>;

type BillTag = {
  bill_id: string;
  tags: { id: string; label: string } | null;
};

/**
 * bill_idごとにタグをグループ化する
 */
function groupTagsByBillId(
  billTags: BillTag[]
): Map<string, Array<{ id: string; label: string }>> {
  return billTags.reduce((acc, bt) => {
    if (bt.tags) {
      const existing = acc.get(bt.bill_id) ?? [];
      acc.set(bt.bill_id, [...existing, bt.tags]);
    }
    return acc;
  }, new Map<string, Array<{ id: string; label: string }>>());
}

/**
 * 複数のbill_idに紐づくタグを一括取得し、bill_idごとにグループ化して返す
 * N+1問題を回避するためのヘルパー
 */
export async function fetchTagsByBillIds(
  supabase: SupabaseClient,
  billIds: string[]
): Promise<Map<string, Array<{ id: string; label: string }>>> {
  if (billIds.length === 0) {
    return new Map();
  }

  const { data: allBillTags, error } = await supabase
    .from("bills_tags")
    .select("bill_id, tags(id, label)")
    .in("bill_id", billIds);

  if (error) {
    throw new Error(`Failed to fetch tags: ${error.message}`);
  }

  return groupTagsByBillId(allBillTags ?? []);
}
