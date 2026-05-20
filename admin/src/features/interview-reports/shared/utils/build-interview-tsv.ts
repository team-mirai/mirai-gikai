import type {
  InterviewMessage,
  InterviewReport,
  InterviewSession,
} from "../types";

export type InterviewSessionForTsv = InterviewSession & {
  interview_report: InterviewReport | null;
  interview_messages: InterviewMessage[];
};

const COLUMNS = [
  "session_id",
  "user_id",
  "started_at",
  "completed_at",
  "archived_at",
  "stance",
  "role",
  "role_title",
  "moderation_score",
  "moderation_status",
  "total_content_richness",
  "is_public_by_user",
  "is_public_by_admin",
  "summary",
  "message_order",
  "message_role",
  "message_content",
  "message_created_at",
] as const;

function escapeTsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : String(value);
  const normalized = str.replace(/[\t\r\n]+/g, " ");
  // Google Sheets 等の数式インジェクション対策: 先頭が = + - @ なら ' を前置
  return /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
}

export function buildInterviewTsv(sessions: InterviewSessionForTsv[]): string {
  const lines: string[] = [COLUMNS.join("\t")];

  for (const session of sessions) {
    const report = session.interview_report;
    const sessionPrefix = [
      session.id,
      session.user_id,
      session.started_at,
      session.completed_at,
      session.archived_at,
      report?.stance ?? null,
      report?.role ?? null,
      report?.role_title ?? null,
      report?.moderation_score ?? null,
      report?.moderation_status ?? null,
      report?.total_content_richness ?? null,
      report?.is_public_by_user ?? null,
      report?.is_public_by_admin ?? null,
      report?.summary ?? null,
    ]
      .map(escapeTsvCell)
      .join("\t");

    const messages = session.interview_messages;
    if (messages.length === 0) {
      lines.push(`${sessionPrefix}\t\t\t\t`);
      continue;
    }

    messages.forEach((message, index) => {
      const messageSuffix = [
        index + 1,
        message.role,
        message.content,
        message.created_at,
      ]
        .map(escapeTsvCell)
        .join("\t");
      lines.push(`${sessionPrefix}\t${messageSuffix}`);
    });
  }

  return lines.join("\n");
}
