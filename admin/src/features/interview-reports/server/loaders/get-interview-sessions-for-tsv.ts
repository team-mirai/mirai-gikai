import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type {
  InterviewMessage,
  InterviewReport,
  InterviewSession,
} from "../../shared/types";
import type { InterviewSessionForTsv } from "../../shared/utils/build-interview-tsv";

const PAGE_SIZE = 1000;

async function fetchAllPaginated<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>
): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  while (true) {
    const page = await fetchPage(offset, offset + PAGE_SIZE - 1);
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

type SessionWithReport = InterviewSession & {
  interview_report: InterviewReport | InterviewReport[] | null;
};

async function fetchAllSessions(
  configId: string
): Promise<SessionWithReport[]> {
  const supabase = createAdminClient();
  return fetchAllPaginated(async (from, to) => {
    const { data, error } = await supabase
      .from("interview_sessions")
      .select("*, interview_report(*)")
      .eq("interview_config_id", configId)
      .order("started_at", { ascending: true })
      .range(from, to);
    if (error) {
      throw new Error(
        `Failed to fetch interview sessions for TSV: ${error.message}`
      );
    }
    return (data ?? []) as SessionWithReport[];
  });
}

async function fetchAllMessages(
  sessionIds: string[]
): Promise<InterviewMessage[]> {
  if (sessionIds.length === 0) return [];
  const supabase = createAdminClient();
  return fetchAllPaginated(async (from, to) => {
    const { data, error } = await supabase
      .from("interview_messages")
      .select("*")
      .in("interview_session_id", sessionIds)
      .order("interview_session_id", { ascending: true })
      .order("created_at", { ascending: true })
      .range(from, to);
    if (error) {
      throw new Error(
        `Failed to fetch interview messages for TSV: ${error.message}`
      );
    }
    return data ?? [];
  });
}

export async function getInterviewSessionsForTsv(
  configId: string
): Promise<InterviewSessionForTsv[]> {
  const sessions = await fetchAllSessions(configId);
  const messages = await fetchAllMessages(sessions.map((s) => s.id));

  const messagesBySessionId = new Map<string, InterviewMessage[]>();
  for (const message of messages) {
    const list = messagesBySessionId.get(message.interview_session_id);
    if (list) {
      list.push(message);
    } else {
      messagesBySessionId.set(message.interview_session_id, [message]);
    }
  }

  return sessions.map((session) => {
    // 1:1 リレーションでも Supabase の生成型では配列で返るケースがあるため正規化
    const reportRelation = session.interview_report;
    const report = Array.isArray(reportRelation)
      ? (reportRelation[0] ?? null)
      : reportRelation;
    return {
      ...session,
      interview_report: report,
      interview_messages: messagesBySessionId.get(session.id) ?? [],
    };
  });
}
