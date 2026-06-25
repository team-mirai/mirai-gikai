import "server-only";

import {
  getPublicBillRespondents,
  getPublicTopicAnalysis,
} from "@mirai-gikai/topic-analysis-core/public-server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jsonResult } from "../utils/json-result";

/**
 * ユーザー向けトピック分析・公開インタビュー回答の「公開（PII セーフ）読み取り」ツール群。
 *
 * 返却データは web 公開表示と同一の §8 フィルタ
 * （管理者公開 × ユーザー公開 × モデレーションOK）を通過したもののみ。
 * user_id・email・会話生ログ等の個人情報は構造的に含まれない。
 */
export function registerTopicAnalysisTools(server: McpServer): void {
  server.registerTool(
    "get_public_topic_analysis",
    {
      title: "公開トピック分析を取得",
      description:
        "指定議案の公開中トピック分析を返す。トピックごとの意見件数・属性内訳（当事者/事業者/専門家/市民）・期待/懸念の集計と、公開済み意見（タイトル・本文・引用）を含む。公開済み（ユーザー同意×管理者公開×モデレーションOK）の意見のみ。公開版が無ければ status=not_ready を返す。個人を特定する情報（user_id・email等）は含まない。",
      inputSchema: {
        billId: z.string().uuid().describe("対象議案のID"),
      },
    },
    async ({ billId }) => {
      const analysis = await getPublicTopicAnalysis(billId);
      if (!analysis) {
        return jsonResult({ status: "not_ready", bill_id: billId });
      }
      return jsonResult(analysis);
    }
  );

  server.registerTool(
    "list_public_respondents",
    {
      title: "公開インタビュー回答一覧を取得",
      description:
        "指定議案の公開済みAIインタビュー回答（回答者1人=1件）を新しい順で返す。各件は立場区分・肩書・賛否（期待/懸念）・要約を含む。公開済み（ユーザー同意×管理者公開）のレポートのみ。個人を特定する情報（user_id・email・会話生ログ等）は含まない。",
      inputSchema: {
        billId: z.string().uuid().describe("対象議案のID"),
      },
    },
    async ({ billId }) => {
      const respondents = await getPublicBillRespondents(billId);
      return jsonResult(respondents);
    }
  );
}
