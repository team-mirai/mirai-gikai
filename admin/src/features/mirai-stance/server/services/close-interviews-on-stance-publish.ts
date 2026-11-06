import "server-only";

import { closeOtherPublicConfigs } from "@/features/interview-config/server/repositories/interview-config-repository";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";

/**
 * 賛否の公開に伴い、議案の公開中インタビューを閉じる。賛否が決まった議案は意見を集める必要がないため。
 * admin の server action と MCP ツールから共通で呼び出す。閉じた件数を返す。
 */
export async function closeInterviewsOnStancePublish(
  billId: string
): Promise<number> {
  const closed = await closeOtherPublicConfigs(billId);
  if (closed > 0) {
    await invalidateWebCache([WEB_CACHE_TAGS.INTERVIEW_CONFIGS]);
  }
  return closed;
}
