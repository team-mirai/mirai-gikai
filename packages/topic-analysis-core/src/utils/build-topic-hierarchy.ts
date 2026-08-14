import type { FinalTopicWithId, TopicDraft } from "../shared/types";

/** LLM が返す大トピック1件（正規化前）。 */
export type BigTopicDraft = {
  title: string;
  description: string;
  /** 配下に置く中トピックの local_id。 */
  member_local_ids: readonly string[];
};

/**
 * 保存用に平坦化した階層。
 * `big` が null なら親行を作らず、children をトップレベルに置く（フラット1階層）。
 */
export type TopicHierarchy = {
  big: TopicDraft | null;
  children: FinalTopicWithId[];
  /**
   * 受け皿として機械的に作った「その他」か。
   * タイトル文字列で判定すると、LLM が同名の大トピックを返したときに
   * 巻き添えで末尾送りになるため明示フラグで持つ。
   */
  isOther: boolean;
};

/** どの大トピックにも入らなかった中トピックの受け皿。 */
export const OTHER_BIG_TOPIC_TITLE = "その他の論点";

const OTHER_BIG_TOPIC_DESCRIPTION =
  "上記のどの大トピックにも収まらなかった論点。";

/**
 * LLM のグルーピング結果を、保存できる2階層に正規化する純粋関数。
 *
 * LLM は「全中トピックをちょうど1つの大トピックに入れる」を守らないことがある。
 * 取りこぼすと意見ごと表示から消え、重複させると同じ中トピックが2箇所に出る。
 * どちらも黙って起きると気づけないので、ここで機械的に閉じる。
 *
 * - 存在しない local_id は捨てる
 * - 同じ中トピックが複数の大トピックに現れたら最初の1つだけ採用する
 * - どこにも入らなかった中トピックは「その他の論点」にまとめる
 * - 中トピックが1つも残らなかった大トピックは落とす
 *
 * 大トピック・中トピックとも、件数の多い順に並べるのは呼び出し側の責務。
 * ここでは LLM が返した順序を保つ。
 */
export function buildTopicHierarchy(
  bigTopics: readonly BigTopicDraft[],
  mediumTopics: readonly FinalTopicWithId[]
): TopicHierarchy[] {
  const byLocalId = new Map(mediumTopics.map((t) => [t.local_id, t]));
  const claimed = new Set<string>();
  const hierarchy: TopicHierarchy[] = [];

  for (const big of bigTopics) {
    const children: FinalTopicWithId[] = [];
    for (const localId of big.member_local_ids) {
      const medium = byLocalId.get(localId);
      if (!medium) continue;
      if (claimed.has(localId)) continue;
      claimed.add(localId);
      children.push(medium);
    }
    if (children.length === 0) continue;
    hierarchy.push({
      big: { title: big.title, description: big.description },
      children,
      isOther: false,
    });
  }

  const orphans = mediumTopics.filter((t) => !claimed.has(t.local_id));
  if (orphans.length > 0) {
    // 大トピックが1つも立たなかった＝グルーピングできていない。
    // 「その他の論点」1つに全部ぶら下げるより、親を作らずフラットに出す。
    if (hierarchy.length === 0) {
      return [{ big: null, children: orphans, isOther: false }];
    }
    hierarchy.push({
      big: {
        title: OTHER_BIG_TOPIC_TITLE,
        description: OTHER_BIG_TOPIC_DESCRIPTION,
      },
      children: orphans,
      isOther: true,
    });
  }

  return hierarchy;
}

/**
 * 中トピックの件数合計が多い順に大トピックを並べ、各大トピック内も件数降順にする。
 * 「その他の論点」は件数によらず末尾に固定する（読み手が最後に見るものなので）。
 */
export function sortHierarchyByOpinionCount(
  hierarchy: readonly TopicHierarchy[],
  countByLocalId: ReadonlyMap<string, number>
): TopicHierarchy[] {
  const countOf = (localId: string) => countByLocalId.get(localId) ?? 0;

  const withSortedChildren = hierarchy.map((entry) => ({
    ...entry,
    children: [...entry.children].sort(
      (a, b) => countOf(b.local_id) - countOf(a.local_id)
    ),
  }));

  const total = (entry: TopicHierarchy) =>
    entry.children.reduce((sum, c) => sum + countOf(c.local_id), 0);
  return withSortedChildren.sort((a, b) => {
    if (a.isOther !== b.isOther) return a.isOther ? 1 : -1;
    return total(b) - total(a);
  });
}
