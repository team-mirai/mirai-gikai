import type { InterviewConfigWithSessionCount } from "../../client/components/interview-config-list";
import type { InterviewConfig } from "../../shared/types";
import {
  countSessionsByConfigIds,
  findInterviewConfigById,
  findInterviewConfigsByBillId,
} from "../repositories/interview-config-repository";

/**
 * 法案IDからすべてのインタビュー設定を取得する（セッション数付き）
 */
export async function getInterviewConfigsWithSessionCount(
  billId: string
): Promise<InterviewConfigWithSessionCount[]> {
  try {
    const configs = await findInterviewConfigsByBillId(billId);
    const configIds = configs.map((c) => c.id);
    const sessionCounts = await countSessionsByConfigIds(configIds);

    return configs.map((config) => ({
      ...config,
      sessionCount: sessionCounts.get(config.id) ?? 0,
    }));
  } catch (error) {
    console.error("Failed to fetch interview configs:", error);
    return [];
  }
}

/**
 * 設定IDからインタビュー設定を取得する
 */
export async function getInterviewConfigById(
  configId: string
): Promise<InterviewConfig | null> {
  try {
    return await findInterviewConfigById(configId);
  } catch (error) {
    console.error("Failed to fetch interview config:", error);
    return null;
  }
}
