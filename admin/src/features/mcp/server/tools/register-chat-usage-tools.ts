import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { findChatUsageMetrics } from "../repositories/chat-usage-repository";
import { jsonResult } from "../utils/json-result";

/**
 * チャット機能の利用状況（chat_usage_events）を集計する内部向け読み取りツール。
 */
export function registerChatUsageTools(server: McpServer): void {
  server.registerTool(
    "get_chat_usage_metrics",
    {
      title: "チャット機能の利用状況を取得",
      description:
        "チャット・AIインタビューのLLM利用イベント（chat_usage_events）をprompt_nameごとに集計して返す。" +
        "各行は prompt_name / event_count（LLM応答回数）/ unique_user_count / unique_session_count / total_tokens / total_cost_usd（USD）で、event_count降順。" +
        "session_idを記録しないイベントは unique_session_count に含まれない（event_countには含まれる）。" +
        "prompt_nameの内訳: top-chat-system=トップページのチャット、bill-chat-system-normal / bill-chat-system-hard=議案ページのチャット（難易度別）、" +
        "interview-chat / interview-initial-question / interview-summary=AIインタビュー関連。" +
        "from/to は occurred_at の範囲（fromは以上、toは未満）。未指定なら全期間。" +
        "billId指定時は metadata.billId でフィルタする。議案チャットとインタビュー系はbillIdを記録するが、トップページチャット（top-chat-system）は記録しないため、指定するとトップチャットは結果に含まれない。",
      inputSchema: {
        from: z
          .string()
          .datetime({ offset: true })
          .optional()
          .describe(
            "集計開始日時（ISO 8601、この日時以降）。未指定なら制限なし"
          ),
        to: z
          .string()
          .datetime({ offset: true })
          .optional()
          .describe(
            "集計終了日時（ISO 8601、この日時より前）。未指定なら制限なし"
          ),
        billId: z
          .string()
          .uuid()
          .optional()
          .describe("対象議案のID（議案チャットのみに絞る場合に指定）"),
      },
    },
    async ({ from, to, billId }) => {
      const metrics = await findChatUsageMetrics({ from, to, billId });
      return jsonResult(metrics);
    }
  );
}
