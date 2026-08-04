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
 *
 * isDataReuseConsented は、二次利用（オープンデータ提供）の告知を表示した
 * UIからの呼び出しのみ渡すこと。未指定の場合は既存の同意状態を維持する。
 */
export async function updatePublicSetting(
  sessionId: string,
  isPublic: boolean,
  isDataReuseConsented?: boolean
): Promise<UpdatePublicSettingResult> {
  const ownershipResult = await verifySessionOwnership(sessionId);

  if (!ownershipResult.authorized) {
    return { success: false, error: ownershipResult.error };
  }

  try {
    const report = await findReportBySessionId(sessionId);
    await updateReportPublicSetting(report.id, isPublic, isDataReuseConsented);
    return { success: true };
  } catch {
    return { success: false, error: "公開設定の更新に失敗しました" };
  }
}
