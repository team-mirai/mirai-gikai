import "server-only";

import { closeOtherPublicConfigs } from "@/features/interview-config/server/repositories/interview-config-repository";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
  type WebCacheTag,
} from "@/lib/utils/cache-invalidation";
import type { BillUpdateInput } from "../../shared/types";
import { shouldAutoCloseInterviewOnBillStatus } from "../../shared/utils/should-auto-close-interview";
import { updateBillRecord } from "../repositories/bill-edit-repository";

/**
 * 議案の更新と、それに伴う副作用（インタビュー自動クローズ・キャッシュ無効化）を一括で実行する。
 * admin の server action と MCP の update_bill ツールから共通で呼び出す。
 * 部分更新に対応するため input は Partial で受ける（undefined フィールドは更新対象外）。
 */
export async function updateBillWithSideEffects(
  id: string,
  input: Partial<BillUpdateInput>
) {
  const { submitted_date, ...rest } = input;
  const definedFields = Object.fromEntries(
    Object.entries(rest).filter(([, value]) => value !== undefined)
  );

  await updateBillRecord(id, {
    ...definedFields,
    ...(submitted_date !== undefined && {
      submitted_date: submitted_date
        ? `${submitted_date}T00:00:00+09:00`
        : null,
    }),
    updated_at: new Date().toISOString(),
  });

  const tagsToInvalidate: WebCacheTag[] = [WEB_CACHE_TAGS.BILLS];
  if (input.status && shouldAutoCloseInterviewOnBillStatus(input.status)) {
    await closeOtherPublicConfigs(id);
    tagsToInvalidate.push(WEB_CACHE_TAGS.INTERVIEW_CONFIGS);
  }

  await invalidateWebCache(tagsToInvalidate);
}
