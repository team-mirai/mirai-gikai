/**
 * 2つのセット（配列）を比較し、追加・削除すべき要素を算出する
 */
export function calculateSetDiff<T>(
  existing: T[],
  incoming: T[]
): { toAdd: T[]; toDelete: T[] } {
  const existingSet = new Set(existing);
  const incomingSet = new Set(incoming);

  const toDelete = existing.filter((item) => !incomingSet.has(item));
  const toAdd = incoming.filter((item) => !existingSet.has(item));

  return { toAdd, toDelete };
}
