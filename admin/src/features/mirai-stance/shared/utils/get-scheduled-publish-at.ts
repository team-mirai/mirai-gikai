import { isMiraiStancePublished } from "@mirai-gikai/shared/mirai-stance/publish-schedule";
import type { MiraiStance } from "../types";

/**
 * 公開予約中（公開設定かつ公開日時前）なら公開日時を返す。それ以外は null。
 * 非公開のスタンスは公開日時が残っていても予約中として扱わない。
 */
export function getScheduledPublishAt(
  stance: Pick<MiraiStance, "is_published" | "publish_at"> | null | undefined,
  now: Date
): string | null {
  if (!stance?.is_published || !stance.publish_at) return null;
  return isMiraiStancePublished(stance, now) ? null : stance.publish_at;
}
