import "server-only";

import type { InterviewMessage } from "../../shared/types";
import type { InterviewSessionForTsv } from "../../shared/utils/build-interview-tsv";
import { normalizeInterviewReport } from "../../shared/utils/normalize-interview-report";
import {
  findAllInterviewMessagesBySessionIds,
  findAllInterviewSessionsWithReportByConfigId,
} from "../repositories/interview-report-repository";

export async function getInterviewSessionsForTsv(
  configId: string
): Promise<InterviewSessionForTsv[]> {
  const sessions = await findAllInterviewSessionsWithReportByConfigId(configId);
  const messages = await findAllInterviewMessagesBySessionIds(
    sessions.map((s) => s.id)
  );

  const messagesBySessionId = new Map<string, InterviewMessage[]>();
  for (const message of messages) {
    const list = messagesBySessionId.get(message.interview_session_id);
    if (list) {
      list.push(message);
    } else {
      messagesBySessionId.set(message.interview_session_id, [message]);
    }
  }

  return sessions.map((session) => ({
    ...session,
    interview_report: normalizeInterviewReport(session.interview_report),
    interview_messages: messagesBySessionId.get(session.id) ?? [],
  }));
}
