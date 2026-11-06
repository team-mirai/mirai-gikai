import type { BillTag, BillWithContent } from "../types";

/** タグのチップに出す最小限。件数はそのタグに紐づく議案数。 */
export type TagChipItem = BillTag & { count: number };

/**
 * タグ別にグループ化された議案から、チップの並びを作る。
 *
 * 0件のタグは落とす。選んでも何も出ないチップを並べる意味がない。
 *
 * カテゴリタブと検索モーダルの両方がこれを使う。別々に導出すると、片方だけ
 * 0件を落とすといった食い違いが起きて、同じタグの数字が画面ごとに変わる。
 */
export function toTagChipItems(
  billsByTag: readonly { tag: BillTag; bills: readonly unknown[] }[]
): TagChipItem[] {
  return billsByTag
    .filter(({ bills }) => bills.length > 0)
    .map(({ tag, bills }) => ({
      id: tag.id,
      label: tag.label,
      count: bills.length,
    }));
}

/**
 * タグの一覧と議案の一覧から、チップの並びを作る。
 *
 * 並びは渡したタグの順のまま。0件のタグは落とす。
 *
 * 件数は渡した議案から数える。呼び出し側が他の絞り込み（キーワード・
 * ステータス・受付中）を適用した結果を渡すことで、チップの数字が実際に
 * 表示される件数と一致する。
 *
 * `keepTagId` に選択中のタグを渡すと、そのタグは0件でも残す。消してしまうと
 * 絞り込みが効いているのに何で絞られているのか画面から分からなくなる。
 */
export function countTagChipItems(
  tags: readonly BillTag[],
  bills: readonly Pick<BillWithContent, "tags">[],
  keepTagId?: string | null
): TagChipItem[] {
  const counts = new Map<string, number>();
  for (const bill of bills) {
    for (const tag of bill.tags) {
      counts.set(tag.id, (counts.get(tag.id) ?? 0) + 1);
    }
  }

  return tags
    .map((tag) => ({
      id: tag.id,
      label: tag.label,
      count: counts.get(tag.id) ?? 0,
    }))
    .filter((item) => item.count > 0 || item.id === keepTagId);
}
