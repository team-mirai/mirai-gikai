"use server";

import { verifySessionOwnership } from "@/features/interview-session/server/utils/verify-session-ownership";
import {
  findReportBySessionId,
  updateReportPublicSetting,
} from "../repositories/interview-report-repository";

interface UpdatePublicSettingResult {
  success: boolean;
  error?: string;
}

/**
 * インタビューレポートの公開設定を更新する
 */
export async function updatePublicSetting(
  sessionId: string,
  isPublic: boolean
): Promise<UpdatePublicSettingResult> {
  const ownershipResult = await verifySessionOwnership(sessionId);

  if (!ownershipResult.authorized) {
    return { success: false, error: ownershipResult.error };
  }

  try {
    const report = await findReportBySessionId(sessionId);
    await updateReportPublicSetting(report.id, isPublic);
    return { success: true };
  } catch {
    return { success: false, error: "公開設定の更新に失敗しました" };
  }
}
