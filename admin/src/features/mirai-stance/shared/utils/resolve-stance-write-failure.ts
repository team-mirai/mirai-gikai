import type { MiraiStance } from "../types";

export type StanceWriteFailureReason =
  | "not_found"
  | "already_published"
  | "stale";

/**
 * 条件付き更新が 0 件だったときに、再読み込みしたスタンスから失敗理由を判定する。
 * 非公開のまま残っている場合は、公開確認後に内容が編集された（stale）とみなす。
 */
export function resolveStanceWriteFailure(
  stance: Pick<MiraiStance, "is_published"> | null
): StanceWriteFailureReason {
  if (!stance) return "not_found";
  if (stance.is_published) return "already_published";
  return "stale";
}
