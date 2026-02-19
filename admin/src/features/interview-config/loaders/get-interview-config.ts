import type { InterviewConfig } from "../types";
import {
  findInterviewConfigById,
  findInterviewConfigsByBillId,
} from "../repositories/interview-config-repository";

/**
 * 法案IDからすべてのインタビュー設定を取得する（複数設定対応）
 */
export async function getInterviewConfigs(
  billId: string
): Promise<InterviewConfig[]> {
  try {
    return await findInterviewConfigsByBillId(billId);
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
