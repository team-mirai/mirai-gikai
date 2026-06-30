import "server-only";

import {
  getRespondentDetail,
  getTopicAnalysis,
  listRespondents,
} from "@mirai-gikai/topic-analysis-core/internal-server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jsonResult } from "../utils/json-result";

/**
 * AIインタビュー内容・トピック分析の**内部向け**読み取りツール群。
 *
 * これは管理者トークン（ADMIN_MCP_TOKEN）で到達する内部ツールであり、**既定では
 * 公開・非公開・モデレーション状態を問わず全件取得**する。プロンプト等から取得条件
 * （公開フラグ・モデレーション状態・公開件数ゲート）を指定したときのみ、その条件で
 * クエリを絞り込む。
 *
 * 取得対象には未公開・未モデレーションのレポートや会話ログ（自由記述）が含まれ得る。
 * ただし user_id・email・有識者登録情報（expert_registrations）等の**直接識別子は
 * 返却型に含めない**。web 公開ページの「公開（§8 固定）」表示とは別経路。
 */

/** 全ツール共通の任意フィルタ。未指定の項目は絞り込まない（＝全件対象）。 */
const filterInput = {
  isPublicByAdmin: z
    .boolean()
    .optional()
    .describe("管理者公開フラグで絞り込む（未指定なら絞らない）"),
  isPublicByUser: z
    .boolean()
    .optional()
    .describe("ユーザー公開（同意）フラグで絞り込む（未指定なら絞らない）"),
  moderationStatus: z
    .enum(["ok", "warning", "ng"])
    .optional()
    .describe("モデレーション状態で絞り込む（例: ok のみ対象にする）"),
  requireDisplayThreshold: z
    .boolean()
    .optional()
    .describe(
      "true で web と同じ k-匿名性ゲート（公開レポートが20件以上の議案のみ）を適用する"
    ),
};

export function registerTopicAnalysisTools(server: McpServer): void {
  server.registerTool(
    "get_topic_analysis",
    {
      title: "トピック分析を取得（内部向け）",
      description:
        "指定議案の最新トピック分析（公開・非公開を問わず最新版）を返す。トピックごとの意見件数・属性内訳（当事者/事業者/専門家/市民）・期待/懸念の集計と意見（タイトル・本文・引用）を含む。既定では全意見が対象。任意フィルタ（公開フラグ・モデレーション状態・公開件数ゲート）で絞り込める。版が無い／件数ゲートで隠す場合は status=not_ready。user_id・email 等の直接識別子は含まない。",
      inputSchema: {
        billId: z.string().uuid().describe("対象議案のID"),
        ...filterInput,
      },
    },
    async ({ billId, ...filter }) => {
      const analysis = await getTopicAnalysis(billId, filter);
      if (!analysis) {
        return jsonResult({ status: "not_ready", bill_id: billId });
      }
      return jsonResult(analysis);
    }
  );

  server.registerTool(
    "list_respondents",
    {
      title: "インタビュー回答一覧を取得（内部向け）",
      description:
        "指定議案のAIインタビュー回答（回答者1人=1件）を新しい順で返す。各件は立場区分・肩書・賛否（期待/懸念）・要約を含む。既定では公開・非公開を問わず全件。任意フィルタ（公開フラグ・モデレーション状態・公開件数ゲート）で絞り込める。件数ゲートで隠す場合は status=below_threshold。user_id・email 等の直接識別子は含まない。",
      inputSchema: {
        billId: z.string().uuid().describe("対象議案のID"),
        ...filterInput,
      },
    },
    async ({ billId, ...filter }) => {
      const respondents = await listRespondents(billId, filter);
      if (respondents === null) {
        return jsonResult({ status: "below_threshold", bill_id: billId });
      }
      return jsonResult(respondents);
    }
  );

  server.registerTool(
    "get_respondent_detail",
    {
      title: "インタビュー回答の詳細（会話ログ）を取得（内部向け）",
      description:
        "指定レポートID（list_respondents の id）の回答詳細を返す。立場区分・肩書・立場説明（role_description）・賛否・要約に加え、AIとの会話ログ（質問と回答のやり取り）を含む。既定では公開・非公開・モデレーション状態を問わず取得。任意フィルタ（公開フラグ・モデレーション状態・公開件数ゲート requireDisplayThreshold）で絞り込める。立場説明・会話ログは自由記述のため固有名詞等が含まれ得る。条件に合致しない／存在しないなら status=not_found。user_id・email・有識者登録情報は含まない。",
      inputSchema: {
        reportId: z
          .string()
          .uuid()
          .describe("対象レポートID（list_respondents の id）"),
        ...filterInput,
      },
    },
    async ({ reportId, ...filter }) => {
      const detail = await getRespondentDetail(reportId, filter);
      if (!detail) {
        return jsonResult({ status: "not_found", report_id: reportId });
      }
      return jsonResult(detail);
    }
  );
}
