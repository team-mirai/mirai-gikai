import "server-only";

import {
  getPublicBillRespondents,
  getPublicRespondentDetail,
  getPublicTopicAnalysis,
} from "@mirai-gikai/topic-analysis-core/public-server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jsonResult } from "../utils/json-result";

/**
 * ユーザー向けトピック分析・公開インタビュー回答の「公開（PII セーフ）読み取り」ツール群。
 *
 * 集計系（get_public_topic_analysis / list_public_respondents）は web 公開表示と同一の
 * §8 フィルタを通過した構造化データのみで、会話生ログ等は含まない。
 * get_respondent_detail は分析用に role_description・会話ログ（自由記述）を返すが、
 * いずれもレポート公開判定（管理者公開 × ユーザー公開）を通過した公開レポートに限り、
 * user_id・email・有識者登録情報（expert_registrations）等の識別子は含めない。
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

  server.registerTool(
    "get_respondent_detail",
    {
      title: "公開インタビュー回答の詳細（会話ログ）を取得",
      description:
        "指定レポートID（list_public_respondents の id）の公開AIインタビュー回答の詳細を返す。立場区分・肩書・立場説明（role_description）・賛否・要約に加え、AIとの会話ログ（質問と回答のやり取り）を含む。公開済み（ユーザー同意×管理者公開）のレポートのみ。立場説明・会話ログは回答者の自由記述のため固有名詞等が含まれ得る点に留意。見つからない／非公開なら status=not_found。user_id・email・有識者登録情報は含まない。",
      inputSchema: {
        reportId: z
          .string()
          .uuid()
          .describe("対象レポートID（list_public_respondents の id）"),
      },
    },
    async ({ reportId }) => {
      const detail = await getPublicRespondentDetail(reportId);
      if (!detail) {
        return jsonResult({ status: "not_found", report_id: reportId });
      }
      return jsonResult(detail);
    }
  );
}
