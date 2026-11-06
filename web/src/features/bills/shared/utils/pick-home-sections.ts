/**
 * トップページのセクションに何を載せるかを決める。
 *
 * 同じ議案が複数のセクションの条件に当てはまる（受付中かつ注目、など）ので、
 * どこに出してどこから外すかを1箇所に集める。ページ側に散らすと、セクションを
 * 足すたびに除外の条件を書き足すことになり、条件の抜けに気づけない。
 */

interface PickHomeSectionsInput<
  TBill extends { id: string },
  TGroup extends { bills: TBill[] },
> {
  /** タグ別セクションの元データ。表示順（優先度順）に並んでいる前提。 */
  billsByTag: readonly TGroup[];
  /** 注目セクションに出す議案。 */
  featuredBills: readonly TBill[];
  /** AIインタビュー受付中セクションに出す議案。 */
  interviewOpenBills: readonly TBill[];
  /** 会期中かどうか。閉会中は注目セクションを出さない。 */
  inSession: boolean;
}

interface PickHomeSectionsResult<TBill, TGroup> {
  /**
   * タグ別セクションに出すグループ。上のセクションや先に並ぶタグに出た議案は
   * 含まない。
   */
  tagGroups: TGroup[];
  /** 画面に出ている議案を重複なく並べたもの。チャットの文脈に渡す。 */
  shownBills: TBill[];
  /** 注目として出ている議案のID。 */
  featuredBillIds: Set<string>;
}

export function pickHomeSections<
  TBill extends { id: string },
  TGroup extends { bills: TBill[] },
>({
  billsByTag,
  featuredBills,
  interviewOpenBills,
  inSession,
}: PickHomeSectionsInput<TBill, TGroup>): PickHomeSectionsResult<
  TBill,
  TGroup
> {
  // 閉会中は注目セクションを出さないので、注目の議案は画面に出ていない扱いにする。
  const shownFeaturedBills = inSession ? featuredBills : [];
  const featuredBillIds = new Set(shownFeaturedBills.map((bill) => bill.id));

  // 受付中と注目に出した議案はタグ別から外す。同じカードが2回並ぶのを避ける。
  // 受付中と注目の間では外さない。受付中のインタビューは注目の議案に付くことが
  // 多く、注目から外すとセクションごと空になってしまう。
  // タグ別の中でも、複数のタグが付いた議案は先に並ぶ（優先度の高い）タグにだけ
  // 出す。全てのタグに出すと、同じカードが別のセクションに何度も並ぶ。
  const shownBillIds = new Set([
    ...interviewOpenBills.map((bill) => bill.id),
    ...featuredBillIds,
  ]);

  const tagGroups = billsByTag
    .map((group) => {
      const bills = group.bills.filter((bill) => !shownBillIds.has(bill.id));
      for (const bill of bills) shownBillIds.add(bill.id);
      return { ...group, bills };
    })
    // 出す議案が残らなかったタグは、見出しだけが残るので落とす。
    .filter((group) => group.bills.length > 0);

  // 受付中と注目は重なるので、IDで一意にする。
  const shownBills = [
    ...new Map(
      [
        ...interviewOpenBills,
        ...shownFeaturedBills,
        ...tagGroups.flatMap((group) => group.bills),
      ].map((bill) => [bill.id, bill])
    ).values(),
  ];

  return { tagGroups, shownBills, featuredBillIds };
}
