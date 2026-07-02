import "server-only";

import type { MessageSearchSession } from "../../shared/types";
import { groupMatchedMessagesBySession } from "../../shared/utils/group-matched-messages";
import { normalizeInterviewReport } from "../../shared/utils/normalize-interview-report";
import {
  findInterviewSessionsWithReportByIds,
  searchUserMessagesByConfigId,
} from "../repositories/interview-report-repository";

export const SEARCH_SESSIONS_PER_PAGE = 20;

/**
 * 検索対象とする一致メッセージ数の上限。
 * これを超えた場合は最新のメッセージのみを対象とし、isTruncated で通知する。
 */
export const MAX_SEARCH_MESSAGES = 500;

export interface MessageSearchResult {
  sessions: MessageSearchSession[];
  totalSessionCount: number;
  matchedMessageCount: number;
  isTruncated: boolean;
}

export async function searchUserMessages(
  configId: string,
  query: string,
  page = 1
): Promise<MessageSearchResult> {
  const matchedMessages = await searchUserMessagesByConfigId(
    configId,
    query,
    MAX_SEARCH_MESSAGES
  );
  const groups = groupMatchedMessagesBySession(matchedMessages);

  const from = (page - 1) * SEARCH_SESSIONS_PER_PAGE;
  const pageGroups = groups.slice(from, from + SEARCH_SESSIONS_PER_PAGE);

  const sessions = await findInterviewSessionsWithReportByIds(
    pageGroups.map((group) => group.sessionId)
  );

  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const sessionsWithMessages: MessageSearchSession[] = [];
  for (const group of pageGroups) {
    const session = sessionMap.get(group.sessionId);
    if (!session) continue;
    sessionsWithMessages.push({
      ...session,
      interview_report: normalizeInterviewReport(session.interview_report),
      matched_messages: group.messages,
    });
  }

  return {
    sessions: sessionsWithMessages,
    totalSessionCount: groups.length,
    matchedMessageCount: matchedMessages.length,
    isTruncated: matchedMessages.length >= MAX_SEARCH_MESSAGES,
  };
}
