import type {
  InterviewStage,
  InterviewReportViewData,
} from "@/features/interview-session/shared/schemas";
import type { VoiceInterviewMessage } from "../types";

/**
 * APIレスポンスやDBメッセージ（JSON文字列）からtextフィールドを抽出する。
 * パースに失敗した場合は元のテキストをそのまま返す。
 */
export function extractText(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return parsed.text ?? raw;
  } catch {
    return raw;
  }
}

/**
 * APIレスポンス文字列から text, nextStage, sessionId, report を抽出する。
 * report の scores フィールドは除外して InterviewReportViewData に変換する。
 */
export function extractResponse(raw: string): {
  text: string;
  nextStage?: InterviewStage;
  sessionId?: string;
  report?: InterviewReportViewData;
} {
  try {
    const parsed = JSON.parse(raw);
    // report から scores を除外して InterviewReportViewData に変換
    let report: InterviewReportViewData | undefined;
    if (parsed.report) {
      const { scores: _, ...viewData } = parsed.report;
      report = viewData;
    }
    return {
      text: parsed.text ?? raw,
      nextStage: parsed.next_stage,
      sessionId: parsed.session_id,
      report,
    };
  } catch {
    return { text: raw };
  }
}

/**
 * initialMessages の content をプレーンテキストに変換する。
 * DB由来のメッセージはJSON文字列の場合があるため。
 */
export function normalizeMessages(
  msgs: VoiceInterviewMessage[]
): VoiceInterviewMessage[] {
  return msgs.map((m) => ({
    ...m,
    content: extractText(m.content),
  }));
}
