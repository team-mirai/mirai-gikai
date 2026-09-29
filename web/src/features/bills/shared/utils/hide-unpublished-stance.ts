import { isMiraiStancePublished } from "@mirai-gikai/shared/mirai-stance/publish-schedule";
import type { BillWithContent } from "../types";

/**
 * 公開日時前のチームみらいの賛否を取り除く。
 * 公開日時前は賛否・コメントとも「未設定」と同じ扱いにする。
 */
export function hideUnpublishedStance(
  bill: BillWithContent,
  now: Date
): BillWithContent {
  if (
    !bill.mirai_stance ||
    isMiraiStancePublished(bill.mirai_stance.publish_at, now)
  ) {
    return bill;
  }
  return { ...bill, mirai_stance: undefined };
}
