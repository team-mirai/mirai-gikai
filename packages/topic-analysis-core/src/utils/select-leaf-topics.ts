/**
 * 葉トピック（意見が紐づくトピック）だけを選ぶ純粋関数。
 *
 * 判定は **意見が1件以上付いているか**。「子を持たないか」では判定しない。
 * 大トピック配下の中トピックを admin から全部削除すると、親は子を失って
 * 「子なし」になり葉に昇格してしまう。その状態の親は領域見出しなのに
 * 増分分析の割当先候補に混ざり、意見が直接ぶら下がる。
 *
 * 保存経路が作る葉は必ず意見1件以上（groupAndSave が0件の中トピックを
 * グルーピング対象から落とす）なので、この規則は正常系では「子を持たない
 * トピック」と一致する。2階層化以前の version も意見が付いた行だけが残る。
 */
export function selectLeafTopics<T>(
  topics: readonly T[],
  hasOpinion: (topic: T) => boolean
): T[] {
  return topics.filter(hasOpinion);
}

/** `topic_opinion` を埋め込みで引いた行から意見の有無を見る。 */
export function hasLinkedOpinion(topic: {
  topic_opinion?: unknown[] | null;
}): boolean {
  return (topic.topic_opinion?.length ?? 0) > 0;
}
