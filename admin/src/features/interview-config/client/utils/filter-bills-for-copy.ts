export type BillFilterOption = {
  id: string;
  name: string;
};

/**
 * コピー先 bill ピッカー用に bill 一覧をフィルタする。
 * - 現在の bill_id は除外
 * - クエリは前後空白を除去し、大文字小文字を無視した部分一致
 */
export function filterBillsForCopy<T extends BillFilterOption>(
  bills: T[],
  currentBillId: string,
  query: string
): T[] {
  const candidates = bills.filter((b) => b.id !== currentBillId);
  const normalized = query.trim().toLowerCase();
  if (!normalized) return candidates;
  return candidates.filter((b) => b.name.toLowerCase().includes(normalized));
}
