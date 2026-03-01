import "server-only";

import { getAuthenticatedUser } from "@/features/interview-session/server/utils/verify-session-ownership";
import type { ReportReactionData } from "../../shared/types";
import {
  findReactionCountsByReportId,
  findUserReaction,
} from "../repositories/report-reaction-repository";

/**
 * レポートのリアクション情報を取得する
 * カウントは常に取得し、ユーザーのリアクションは認証済みの場合のみ取得
 */
export async function getReportReactions(
  reportId: string
): Promise<ReportReactionData> {
  const counts = await findReactionCountsByReportId(reportId);

  let userReaction: ReportReactionData["userReaction"] = null;
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult.authenticated) {
      userReaction = await findUserReaction(reportId, authResult.userId);
    }
  } catch {
    // 認証なしの場合はuserReaction = nullのまま
  }

  return { counts, userReaction };
}
