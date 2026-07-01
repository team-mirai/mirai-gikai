import { mapRoleToCategory } from "./build-public-topic-analysis";
import { normalizeRoleTitle } from "./normalize-role-title";
import { normalizeStanceToSentiment } from "./normalize-stance";
import type {
  PublicRespondentDetail,
  RawRespondentDetailRow,
  RawTranscriptMessageRow,
  TranscriptMessage,
} from "./public-types";

/** interview_messages.role を会話ログの speaker に正規化（assistant/user 以外は除外）。 */
function toSpeaker(role: string | null): TranscriptMessage["speaker"] | null {
  if (role === "assistant" || role === "user") return role;
  return null;
}

/**
 * 公開レポートの生行＋会話メッセージから、回答者詳細の表示データを構築する純粋関数。
 * role→カテゴリ・stance→期待/懸念に正規化し、会話ログは assistant/user のみ残す。
 * フィルタ（管理者公開×ユーザー公開）は取得側で適用済み。
 */
export function buildPublicRespondentDetail(
  report: RawRespondentDetailRow,
  messages: RawTranscriptMessageRow[]
): PublicRespondentDetail {
  const transcript: TranscriptMessage[] = [];
  for (const m of messages) {
    const speaker = toSpeaker(m.role);
    if (!speaker) continue;
    transcript.push({
      id: m.id,
      speaker,
      content: m.content,
      created_at: m.created_at,
    });
  }

  return {
    id: report.id,
    user_category: mapRoleToCategory(report.role),
    role_title: normalizeRoleTitle(report.role_title),
    role_description: report.role_description,
    bill_sentiment: normalizeStanceToSentiment(report.stance),
    summary: report.summary,
    created_at: report.created_at,
    messages: transcript,
  };
}
