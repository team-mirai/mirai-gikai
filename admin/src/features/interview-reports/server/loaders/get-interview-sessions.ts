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
  findHelpfulCountsByReportIds,
  findInterviewConfigIdByBillId,
  findInterviewMessageCounts,
  findInterviewSessionsWithReport,
  findInterviewSessionsWithReportByIds,
  findSessionIdsOrderedByHelpfulCount,
  findSessionIdsOrderedByMessageCount,
  findSessionIdsOrderedByTotalContentRichness,
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

  // RPC経由ソート用のディスパッチテーブル
  const rpcSortFetchers = {
    total_content_richness: findSessionIdsOrderedByTotalContentRichness,
    helpful_count: findSessionIdsOrderedByHelpfulCount,
    message_count: findSessionIdsOrderedByMessageCount,
  } as const;

  // message_count/total_content_richness/helpful_countソートの場合はDB関数でソート済みIDを取得してからセッションを取得
  let sessions: Awaited<ReturnType<typeof findInterviewSessionsWithReport>>;
  try {
    const rpcFetcher =
      rpcSortFetchers[sort.field as keyof typeof rpcSortFetchers];
    if (rpcFetcher) {
      const orderedIds = await rpcFetcher(
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

  // 全セッションのメッセージ数・リアクション数を一括取得
  const sessionIds = sessions.map((s) => s.id);

  // interview_reportは配列で返ってくるので最初の要素を取得するヘルパー
  const normalizeReport = (
    report: (typeof sessions)[number]["interview_report"]
  ) => (Array.isArray(report) ? report[0] || null : report);

  // レポートIDを収集
  const reportIds = sessions
    .map((s) => normalizeReport(s.interview_report)?.id)
    .filter((id): id is string => id != null);

  let messageCounts:
    | Awaited<ReturnType<typeof findInterviewMessageCounts>>
    | undefined;
  let helpfulCountsMap = new Map<string, number>();

  // メッセージ数とリアクション数を並列取得（個別にエラーハンドリング）
  const [messageCountsResult, helpfulCountsResult] = await Promise.allSettled([
    findInterviewMessageCounts(sessionIds),
    findHelpfulCountsByReportIds(reportIds),
  ]);

  if (messageCountsResult.status === "fulfilled") {
    messageCounts = messageCountsResult.value;
  } else {
    if (sort.field === "message_count") {
      throw messageCountsResult.reason;
    }
    console.error(
      "Failed to fetch message counts:",
      messageCountsResult.reason
    );
  }

  if (helpfulCountsResult.status === "fulfilled") {
    helpfulCountsMap = helpfulCountsResult.value;
  } else {
    if (sort.field === "helpful_count") {
      throw helpfulCountsResult.reason;
    }
    console.error(
      "Failed to fetch helpful counts:",
      helpfulCountsResult.reason
    );
  }

  // セッションIDごとのメッセージ数をマップに変換（missing sessions default to 0）
  const messageCountMap = new Map<string, number>();
  for (const id of sessionIds) {
    messageCountMap.set(id, 0);
  }
  for (const row of messageCounts || []) {
    messageCountMap.set(row.interview_session_id, Number(row.message_count));
  }

  // セッションにメッセージ数・リアクション数を付与
  const sessionsWithDetails: InterviewSessionWithDetails[] = sessions.map(
    (session) => {
      const report = normalizeReport(session.interview_report);
      const helpfulCount = report ? (helpfulCountsMap.get(report.id) ?? 0) : 0;

      return {
        ...session,
        message_count: messageCountMap.get(session.id) || 0,
        helpful_count: helpfulCount,
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
