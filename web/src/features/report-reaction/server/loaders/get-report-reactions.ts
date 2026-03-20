import "server-only";

import { getAuthenticatedUser } from "@/features/interview-session/server/utils/verify-session-ownership";
import type { ReactionCounts, ReportReactionData } from "../../shared/types";
import {
  findReactionCountsByReportId,
  findReactionCountsByReportIds,
  findUserReaction,
  findUserReactionsByReportIds,
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
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      (e.constructor.name === "DynamicServerError" ||
        e.message.includes("Dynamic server usage"))
    ) {
      throw e;
    }
  }

  return { counts, userReaction };
}

/**
 * 複数レポートのリアクション情報を一括取得する
 * N+1クエリを避けるためバッチで取得
 */
export async function getReportReactionsBatch(
  reportIds: string[]
): Promise<Map<string, ReportReactionData>> {
  const resultMap = new Map<string, ReportReactionData>();
  if (reportIds.length === 0) return resultMap;

  const countsMap = await findReactionCountsByReportIds(reportIds);

  let userReactionsMap = new Map<string, ReportReactionData["userReaction"]>();
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult.authenticated) {
      userReactionsMap = await findUserReactionsByReportIds(
        reportIds,
        authResult.userId
      );
    }
  } catch (e: unknown) {
    // Next.jsの動的レンダリングエラーは再スローして適切にdynamic化させる
    if (
      e instanceof Error &&
      (e.constructor.name === "DynamicServerError" ||
        e.message.includes("Dynamic server usage"))
    ) {
      throw e;
    }
    // その他のエラー（認証なし等）はuserReaction = nullのまま
  }

  const defaultCounts: ReactionCounts = { helpful: 0, hmm: 0 };
  for (const reportId of reportIds) {
    resultMap.set(reportId, {
      counts: countsMap.get(reportId) ?? { ...defaultCounts },
      userReaction: userReactionsMap.get(reportId) ?? null,
    });
  }

  return resultMap;
}
