import { STALE_PENDING_MS, STALE_RUNNING_MS } from "../shared/constants";

export type ActiveVersionRow = {
  status: string;
  /** running になった時刻（pending では null） */
  started_at: string | null;
  /** 作成時刻 */
  created_at: string;
};

/**
 * 二重起動ガード（findActiveVersionByBill）が拾った pending/running の version が
 * 「実際にはもう動いていない（失効）」かどうかを判定する純粋関数。
 *
 * Cloud Run の Job 実行は受理後に worker コード到達前に死ぬことがあり、その場合
 * version が pending/running のまま残る。一定時間進捗が無い行は失効とみなし、
 * 呼び出し側（dispatch）が failed に倒して再実行を許可できるようにする。
 *
 * - pending: 起動されれば worker が数秒で running にするため、created_at から
 *   STALE_PENDING_MS を超えても pending のままなら失効。
 * - running: started_at（無ければ created_at）から STALE_RUNNING_MS を超えても
 *   完了していなければ失効（task-timeout 超過で worker が死んだ等）。
 * - completed/failed 等はそもそも active ではないため失効扱いしない（false）。
 */
export function isStaleActiveVersion(
  version: ActiveVersionRow,
  nowMs: number
): boolean {
  if (version.status === "pending") {
    const createdMs = Date.parse(version.created_at);
    if (Number.isNaN(createdMs)) return false;
    return nowMs - createdMs > STALE_PENDING_MS;
  }
  if (version.status === "running") {
    const ref = version.started_at ?? version.created_at;
    const refMs = Date.parse(ref);
    if (Number.isNaN(refMs)) return false;
    return nowMs - refMs > STALE_RUNNING_MS;
  }
  return false;
}
