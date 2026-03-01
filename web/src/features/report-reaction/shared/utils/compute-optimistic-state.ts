import type { ReactionCounts, ReactionType } from "../types";

export type OptimisticState = {
  counts: ReactionCounts;
  userReaction: ReactionType | null;
};

/**
 * リアクションボタンクリック時のoptimistic stateを計算する純粋関数
 * - 同じボタン → 解除
 * - 別のボタン → 切り替え（旧を減らし新を増やす）
 * - 未リアクション → 追加
 */
export function computeOptimisticState(
  state: OptimisticState,
  clickedType: ReactionType
): OptimisticState {
  const { counts, userReaction } = state;
  const newCounts = { ...counts };

  if (userReaction === clickedType) {
    newCounts[clickedType] = Math.max(0, newCounts[clickedType] - 1);
    return { counts: newCounts, userReaction: null };
  }

  if (userReaction !== null) {
    newCounts[userReaction] = Math.max(0, newCounts[userReaction] - 1);
  }
  newCounts[clickedType] = newCounts[clickedType] + 1;
  return { counts: newCounts, userReaction: clickedType };
}
