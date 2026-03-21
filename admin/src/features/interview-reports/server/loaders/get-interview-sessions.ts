import "server-only";

import type {
  InterviewSessionWithDetails,
  SessionFilterConfig,
  SessionSortConfig,
} from "../../shared/types";
import {
  DEFAULT_SESSION_FILTER,
  DEFAULT_SESSION_SORT,
} from "../../shared/types";
import { calculatePaginationRange } from "../../shared/utils/pagination-utils";
import {
  countInterviewSessionsByConfigId,
  findInterviewConfigIdByBillId,
  findInterviewMessageCounts,
  findInterviewSessionsWithReport,
  findInterviewSessionsWithReportByIds,
  findSessionIdsOrderedByMessageCount,
  findSessionIdsOrderedByTotalScore,
} from "../repositories/interview-report-repository";

export const SESSIONS_PER_PAGE = 30;

export async function getInterviewSessions(
  billId: string,
  page = 1,
  sort: SessionSortConfig = DEFAULT_SESSION_SORT,
  filters: SessionFilterConfig = DEFAULT_SESSION_FILTER
): Promise<InterviewSessionWithDetails[]> {
  const config = await findInterviewConfigIdByBillId(billId);

  if (!config) {
    return [];
  }

  // ページネーション計算
  const { from, to } = calculatePaginationRange(page, SESSIONS_PER_PAGE);
  const limit = to - from + 1;

  // message_count/total_scoreソートの場合はDB関数でソート済みIDを取得してからセッションを取得
  let sessions: Awaited<ReturnType<typeof findInterviewSessionsWithReport>>;
  try {
    if (sort.field === "message_count" || sort.field === "total_score") {
      const orderedIds =
        sort.field === "total_score"
          ? await findSessionIdsOrderedByTotalScore(
              config.id,
              sort.order === "asc",
              from,
              limit,
              filters
            )
          : await findSessionIdsOrderedByMessageCount(
              config.id,
              sort.order === "asc",
              from,
              limit,
              filters
            );
      sessions = await findInterviewSessionsWithReportByIds(orderedIds);
    } else {
      sessions = await findInterviewSessionsWithReport(
        config.id,
        from,
        to,
        {
          column: sort.field,
          ascending: sort.order === "asc",
        },
        filters
      );
    }
  } catch (error) {
    console.error("Failed to fetch interview sessions:", error);
    return [];
  }

  // 全セッションのメッセージ数を一括取得（RPCで1クエリ集計）
  const sessionIds = sessions.map((s) => s.id);
  let messageCounts:
    | Awaited<ReturnType<typeof findInterviewMessageCounts>>
    | undefined;
  try {
    messageCounts = await findInterviewMessageCounts(sessionIds);
  } catch (error) {
    console.error("Failed to fetch message counts:", {
      error,
      sessionIds,
    });
  }

  // セッションIDごとのメッセージ数をマップに変換（missing sessions default to 0）
  const countMap = new Map<string, number>();
  for (const id of sessionIds) {
    countMap.set(id, 0);
  }
  for (const row of messageCounts || []) {
    countMap.set(row.interview_session_id, Number(row.message_count));
  }

  // セッションにメッセージ数を付与
  const sessionsWithDetails: InterviewSessionWithDetails[] = sessions.map(
    (session) => {
      // interview_reportは配列で返ってくるので最初の要素を取得
      const report = Array.isArray(session.interview_report)
        ? session.interview_report[0] || null
        : session.interview_report;

      return {
        ...session,
        message_count: countMap.get(session.id) || 0,
        interview_report: report,
      };
    }
  );

  return sessionsWithDetails;
}

export async function getInterviewSessionsCount(
  billId: string,
  filters: SessionFilterConfig = DEFAULT_SESSION_FILTER
): Promise<number> {
  const config = await findInterviewConfigIdByBillId(billId);

  if (!config) {
    return 0;
  }

  try {
    return await countInterviewSessionsByConfigId(config.id, filters);
  } catch (error) {
    console.error("Failed to fetch session count:", error);
    return 0;
  }
}
