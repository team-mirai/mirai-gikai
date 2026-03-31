import type { InterviewConfig } from "../../shared/types";
import {
  countSessionsByConfigIds,
  findInterviewConfigById,
  findInterviewConfigsByBillId,
} from "../repositories/interview-config-repository";

/**
 * 法案IDからすべてのインタビュー設定を取得する
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
 * 各インタビュー設定に紐づくセッション数を取得する
 * 取得失敗時はnullを返し、UI側で「不明」として扱えるようにする
 */
export async function getSessionCountsByConfigIds(
  configIds: string[]
): Promise<Record<string, number> | null> {
  try {
    return await countSessionsByConfigIds(configIds);
  } catch (error) {
    console.error("Failed to fetch session counts:", error);
    return null;
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
