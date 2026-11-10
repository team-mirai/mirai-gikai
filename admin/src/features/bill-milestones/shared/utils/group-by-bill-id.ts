/** bill_id ごとに行をまとめる。各行からは bill_id を除き、元の並び順を保つ */
export function groupByBillId<T extends { bill_id: string }>(
  rows: T[]
): Map<string, Omit<T, "bill_id">[]> {
  const grouped = new Map<string, Omit<T, "bill_id">[]>();
  for (const { bill_id, ...rest } of rows) {
    const group = grouped.get(bill_id);
    if (group) {
      group.push(rest);
    } else {
      grouped.set(bill_id, [rest]);
    }
  }
  return grouped;
}
