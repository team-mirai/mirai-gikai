import type { BillStatusEnum } from "../types";

/**
 * 法案一覧のステータス絞り込みで使うグループ。
 *
 * DB の status は6値（preparing / introduced / in_originating_house /
 * in_receiving_house / enacted / rejected）だが、一覧のタブはデザイン上4つに束ねる。
 * 審議の場所（衆・参）は絞り込みの軸としては細かすぎるため、まとめて「審議中」にする。
 */
export const BILL_STATUS_GROUPS = [
  "all",
  "deliberating",
  "waiting",
  "enacted",
  "rejected",
] as const;

export type BillStatusGroup = (typeof BILL_STATUS_GROUPS)[number];

export const BILL_STATUS_GROUP_LABELS: Record<BillStatusGroup, string> = {
  all: "すべて",
  deliberating: "審議中",
  waiting: "審議待ち",
  enacted: "成立",
  rejected: "否決",
};

/**
 * status をタブのグループに畳む。
 *
 * 既存の `getCardStatusLabel` と同じ畳み方にする。あちらは `introduced` を
 * 「国会審議中」に含めるので、ここで「審議待ち」に落とすと、カードに
 * 「国会審議中」と出ている法案が「審議中」タブに現れない。
 *
 * 結果として「審議待ち」に残るのは `preparing`（提出前）だけになる。
 */
export function toBillStatusGroup(
  status: BillStatusEnum
): Exclude<BillStatusGroup, "all"> {
  switch (status) {
    case "introduced":
    case "in_originating_house":
    case "in_receiving_house":
      return "deliberating";
    case "enacted":
      return "enacted";
    case "rejected":
      return "rejected";
    default:
      return "waiting";
  }
}

/** 文字列をグループに絞り込む型ガード。URL 直打ちで壊れないようにする。 */
export function isBillStatusGroup(value: unknown): value is BillStatusGroup {
  return (
    typeof value === "string" &&
    (BILL_STATUS_GROUPS as readonly string[]).includes(value)
  );
}

/** グループごとの件数。呼び出し側が渡した母集合をそのまま数える。 */
export function countByStatusGroup(
  bills: readonly { status: BillStatusEnum }[]
): Record<BillStatusGroup, number> {
  const counts: Record<BillStatusGroup, number> = {
    all: bills.length,
    deliberating: 0,
    waiting: 0,
    enacted: 0,
    rejected: 0,
  };
  for (const bill of bills) {
    counts[toBillStatusGroup(bill.status)] += 1;
  }
  return counts;
}

/** グループで絞る。`all` は素通し。 */
export function filterByStatusGroup<T extends { status: BillStatusEnum }>(
  bills: readonly T[],
  group: BillStatusGroup
): T[] {
  if (group === "all") return [...bills];
  return bills.filter((bill) => toBillStatusGroup(bill.status) === group);
}
