import "server-only";

import { ChatError, ChatErrorCode } from "../../shared/types/errors";
import { getTotalUsageCostUsd } from "./cost-tracker";
import { getJstDayRange } from "../../shared/utils/jst-day-range";
import { env } from "@/lib/env";

/**
 * システム全体の1日の予算上限を超過していないかチェックし、
 * 超過している場合は ChatError をスローする
 */
export async function checkSystemDailyCostLimit(): Promise<void> {
  const jstDayRange = getJstDayRange();
  const totalCost = await getTotalUsageCostUsd(
    jstDayRange.from,
    jstDayRange.to
  );
  const limitCost = env.chat.dailyTotalCostLimitUsd;

  if (totalCost >= limitCost) {
    throw new ChatError(ChatErrorCode.SYSTEM_DAILY_COST_LIMIT_REACHED);
  }
}
