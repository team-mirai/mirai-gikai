import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { findInterviewMetricsByBill } from "@/features/interview-reports/server/repositories/interview-report-repository";
import { jsonResult } from "../utils/json-result";

/**
 * 議案ごとのAIインタビュー実施状況（実施数・完了数・完了率・総回答時間）を取得する内部向け読み取りツール。
 */
export function registerInterviewMetricsTools(server: McpServer): void {
  server.registerTool(
    "get_interview_metrics_by_bill",
    {
      title: "議案ごとのAIインタビュー実施状況を取得",
      description:
        "議案ごとにAIインタビューの実施数（開始されたセッション総数）・完了数（completed_atが設定されたセッション数）・完了率（完了数/実施数、0〜1）・総回答時間（total_duration_seconds、秒。完了セッションは completed_at−started_at、途中離脱セッションは最終発言までの時間で集計し、発言の無い未完了セッションは集計から除外）を返す。AIインタビュー設定を持つ議案のみが対象で、論理削除済みの設定は除外する。1議案に複数の設定がある場合は合算する。billId未指定なら全議案を実施数の多い順で返す。billId指定でその議案のみ返す（設定が無い議案は空配列）。",
      inputSchema: {
        billId: z
          .string()
          .uuid()
          .optional()
          .describe("対象議案のID（未指定なら全議案）"),
      },
    },
    async ({ billId }) => {
      const metrics = await findInterviewMetricsByBill(billId);
      return jsonResult(metrics);
    }
  );
}
