import "server-only";

import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { closeOtherPublicConfigs } from "../repositories/interview-config-repository";

/**
 * 議案の公開中 AI インタビューを閉じ、閉じた件数を返す。意見を集める必要がなくなった議案に使う
 * （チームみらいの賛否を公開したとき・法案が成立したとき）。admin の server action と MCP ツールから共通で呼び出す。
 */
export async function closePublicInterviews(billId: string): Promise<number> {
  const closed = await closeOtherPublicConfigs(billId);
  if (closed > 0) {
    await invalidateWebCache([WEB_CACHE_TAGS.INTERVIEW_CONFIGS]);
  }
  return closed;
}
