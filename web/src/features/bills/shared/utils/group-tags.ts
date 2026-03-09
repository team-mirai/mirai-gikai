type BillTag = {
  bill_id: string;
  tags: { id: string; label: string } | null;
};

/**
 * bill_idごとにタグをグループ化する
 */
export function groupTagsByBillId(
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
