import "server-only";

import { MIN_PUBLIC_REPORTS_FOR_DISPLAY } from "@mirai-gikai/shared/report-publication/auto-publish";
import type {
  OpenDataInterviewItem,
  OpenDataInterviewsResult,
  OpenDataMessage,
} from "../../shared/types/open-data";
import { encodeCursor, type OpenDataCursor } from "../../shared/utils/cursor";
import { toOpenDataOpinions } from "../../shared/utils/opinions";
import { toOpenDataMessage } from "../../shared/utils/to-open-data-message";
import {
  findMessagesBySessionIds,
  findOpenDataReports,
} from "../repositories/open-data-repository";

/**
 * 公開データAPI用のインタビューデータを取得する。
 * limit+1 件取得して次ページの有無を判定し、nextCursor を組み立てる。
 */
export async function getOpenDataInterviews(params: {
  limit: number;
  cursor: OpenDataCursor | null;
}): Promise<OpenDataInterviewsResult> {
  const rows = await findOpenDataReports({
    minPublicReports: MIN_PUBLIC_REPORTS_FOR_DISPLAY,
    limit: params.limit + 1,
    cursor: params.cursor,
  });

  const hasMore = rows.length > params.limit;
  const pageRows = hasMore ? rows.slice(0, params.limit) : rows;

  const messages = await findMessagesBySessionIds(
    pageRows.map((row) => row.interview_session_id)
  );
  const messagesBySession = new Map<string, OpenDataMessage[]>();
  for (const message of messages) {
    const list = messagesBySession.get(message.interview_session_id) ?? [];
    list.push(toOpenDataMessage(message));
    messagesBySession.set(message.interview_session_id, list);
  }

  const items: OpenDataInterviewItem[] = pageRows.map((row) => ({
    reportId: row.report_id,
    billId: row.bill_id,
    billName: row.bill_name,
    stance: row.stance,
    role: row.role,
    roleTitle: row.role_title,
    roleDescription: row.role_description,
    summary: row.summary,
    opinions: toOpenDataOpinions(row.opinions),
    messages: messagesBySession.get(row.interview_session_id) ?? [],
    createdAt: row.created_at,
  }));

  const lastRow = pageRows.at(-1);
  const nextCursor =
    hasMore && lastRow
      ? encodeCursor({ createdAt: lastRow.created_at, id: lastRow.report_id })
      : null;

  return { items, nextCursor };
}
