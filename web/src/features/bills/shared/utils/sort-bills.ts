import { BILL_STATUS_ORDER, type BillStatusEnum } from "../types";

export const BILL_SORT_KEYS = [
  "voices",
  "new",
  "updated",
  "old",
  "status",
] as const;

export type BillSortKey = (typeof BILL_SORT_KEYS)[number];

export const BILL_SORT_LABELS: Record<BillSortKey, string> = {
  voices: "声が集まっている順",
  new: "提出日が新しい順",
  updated: "更新が新しい順",
  old: "提出日が古い順",
  status: "審議状況順",
};

export const DEFAULT_BILL_SORT: BillSortKey = "new";

/** 文字列を並び順に絞り込む型ガード。URL 直打ちで壊れないようにする。 */
export function isBillSortKey(value: unknown): value is BillSortKey {
  return (
    typeof value === "string" &&
    (BILL_SORT_KEYS as readonly string[]).includes(value)
  );
}

type SortableBill = {
  submitted_date: string | null;
  updated_at: string;
  status: BillStatusEnum;
  publicReportCount?: number;
};

/**
 * 一覧の並び替え。
 *
 * 提出日は null がありうる。日付が無い法案を上位に紛れ込ませると
 * 「新しい順」の意味が壊れるので、昇順・降順のどちらでも最後尾に落とす。
 *
 * 同点は元の順序を保つ（V8 の安定ソート）。呼び出し側が事前に決めた
 * 並びが、同点の中では維持される。
 */
export function sortBills<T extends SortableBill>(
  bills: readonly T[],
  key: BillSortKey
): T[] {
  const sorted = [...bills];

  switch (key) {
    case "voices":
      // 回答が無い議案は 0 として最後尾に沈む。
      return sorted.sort(
        (a, b) => (b.publicReportCount ?? 0) - (a.publicReportCount ?? 0)
      );
    case "new":
      return sorted.sort(bySubmittedDate("desc"));
    case "old":
      return sorted.sort(bySubmittedDate("asc"));
    case "updated":
      return sorted.sort(
        (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)
      );
    case "status":
      return sorted.sort(
        (a, b) => BILL_STATUS_ORDER[a.status] - BILL_STATUS_ORDER[b.status]
      );
  }
}

function bySubmittedDate(direction: "asc" | "desc") {
  return (a: SortableBill, b: SortableBill) => {
    // 日付なしは常に最後尾。方向を反転させても沈めたままにする。
    if (!a.submitted_date && !b.submitted_date) return 0;
    if (!a.submitted_date) return 1;
    if (!b.submitted_date) return -1;

    const diff = Date.parse(a.submitted_date) - Date.parse(b.submitted_date);
    return direction === "asc" ? diff : -diff;
  };
}
