import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { findBillMilestoneSourcesSince } from "@/features/bill-milestones/server/repositories/bill-milestone-repository";
import { buildBillMilestoneFact } from "@/features/bill-milestones/shared/utils/build-bill-milestone-fact";
import { renderBillBreakingNewsImage } from "@/features/bills-edit/server/services/render-bill-breaking-news-image";
import { BREAKING_NEWS_RESULTS } from "@/features/bills-edit/shared/utils/breaking-news-image";
import { env } from "@/lib/env";
import { jsonResult } from "../utils/json-result";

export function registerBillMilestoneTools(server: McpServer): void {
  server.registerTool(
    "list_bill_milestone_facts",
    {
      title: "法案の節目の発生日時を一覧",
      description:
        "since（ISO 8601、タイムゾーン付き）以降に節目（初公開・審議状況の変化・チームみらいの賛否の公開・AI インタビューの公開）がある法案を返す。投稿するかどうかの判定はせず、事実だけを返す。日時の null は「いつ起きたか分からない」（記録を始める前の出来事、または未発生）を表す。各フィールド: name は正式名、easyTitle はやさしい版（difficulty_level=normal）の記事タイトル（無ければ null）、originatingHouse は先議院（HR=衆議院 / HC=参議院）、status は現在の審議状況、publishStatus は公開ステータス（draft / published / coming_soon）、articleKind は記事の種類（standard / ai_generated）、firstPublishedAt は初めて公開した日時（一度入ったら変わらない）、statusChanges は since 以降の審議状況の変化を古い順にすべて（from は変更前・法案作成時は null、to は変更後、changedAt は変わった日時。否決の場合は直前の状態からどちらの院で否決されたかが分かる）、stance はチームみらいの賛否（未設定なら null。type は賛否の種類、isPublished は今の時点で公開サイトに出ているか＝予約公開で公開日時がまだ来ていなければ false、publishedAt は公開日時と予約公開日時の新しい方＝実際に表に出た（出る）日時。非公開に戻すと null になるので、直近に公開された日時を表す）、interview は削除されていない AI インタビュー設定のうち公開中のもの（isPublic は公開中か、publishedAt は公開した日時。公開中が無ければ isPublic=false, publishedAt=null。closed にすると null になるので、直近に公開された日時を表す）、urls は公開サイトの法案ページとインタビューページの URL。",
      inputSchema: {
        since: z
          .string()
          .datetime({ offset: true })
          .describe(
            "この日時以降の節目を対象にする（ISO 8601、タイムゾーン付き）"
          ),
      },
    },
    async ({ since }) => {
      const sources = await findBillMilestoneSourcesSince(
        new Date(since).toISOString()
      );
      const now = new Date();
      // 投稿側で法案が漏れたときに追えるよう、返した法案の ID を残す
      console.info(
        `[AdminMcp] list_bill_milestone_facts billIds=${sources.map((source) => source.id).join(",")}`
      );
      return jsonResult({
        bills: sources.map((source) =>
          buildBillMilestoneFact(source, { now, webUrl: env.webUrl })
        ),
      });
    }
  );

  server.registerTool(
    "render_breaking_news_image",
    {
      title: "法案の速報画像を作成",
      description:
        "法案の速報画像（PNG、X 投稿用）を作り、MCP の image content で返す。画像に日付は入れない。result は結果（成立 / 可決 / 否決 / 廃案）、reachedStep はどこまで進んだか（0 始まりの段番号。段は 提出 → 先議院 → 後議院 → 成立 の4段。成立なら 3、それ以外は 0〜2）、place は場所（例: 衆議院本会議、30文字以内、省略可）、title は画像のタイトル（改行で最大2行、1行が長すぎるとエラー）、includeStance はチームみらいの賛否を入れるか（DB で公開中の賛否だけを使う。公開中の賛否が無いのに true ならエラー）。失敗したときは isError=true と理由のテキスト（入力が不正 / 法案が無い / フォントを読み込めない）を返す。",
      inputSchema: {
        billId: z.string().uuid(),
        result: z.enum(BREAKING_NEWS_RESULTS),
        reachedStep: z.number().int(),
        place: z.string().optional(),
        title: z.string(),
        includeStance: z.boolean(),
      },
    },
    async ({ billId, result, reachedStep, place, title, includeStance }) => {
      const rendered = await renderBillBreakingNewsImage({
        billId,
        result,
        // service は画像 API のクエリ文字列と同じ形で受け取り、検証する
        reachedStep: String(reachedStep),
        date: null,
        place: place ?? null,
        title,
        includeStance,
      });
      if (!rendered.ok) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: rendered.message }],
        };
      }
      return {
        content: [
          {
            type: "image" as const,
            data: Buffer.from(rendered.png).toString("base64"),
            mimeType: "image/png",
          },
        ],
      };
    }
  );
}
