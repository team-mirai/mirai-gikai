import {
  isReportTurn,
  parseAssistantMessageContent,
} from "@mirai-gikai/shared/interview-report/parse-assistant-message";
import type { ReextractionMessage, StoredMessage } from "../shared/types";

/**
 * 再抽出用に保存済みメッセージを整形する純粋関数。
 * - assistant のレポート提示ターン（report を含む要約ターン）のみ除外する。
 *   旧レポートの opinions に引きずられず新プロンプトで再生成させるため。
 * - **要約フェーズでのユーザーの修正・追記は保持する**（user メッセージは落とさない）。
 *   完了フローは確定レポートにこれらを反映するため、再抽出でも取りこぼさない。
 * - assistant は表示テキストへ、user は内容＋id（source_message_id 解決用）に整形。
 */
export function prepareReextractionMessages(
  messages: StoredMessage[]
): ReextractionMessage[] {
  return messages
    .filter((m) => !(m.role === "assistant" && isReportTurn(m.content)))
    .map((m) =>
      m.role === "user"
        ? { role: "user", content: m.content, id: m.id }
        : {
            role: m.role,
            content: parseAssistantMessageContent(m.content).text,
          }
    );
}
