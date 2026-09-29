import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  findStanceByBillId,
  upsertMiraiStance,
} from "@/features/mirai-stance/server/repositories/mirai-stance-repository";
import { stanceInputSchema } from "@/features/mirai-stance/shared/types";
import { invalidateBillsCache } from "../utils/invalidate-bills-cache";
import { jsonResult } from "../utils/json-result";

export function registerMiraiStanceTools(server: McpServer): void {
  server.registerTool(
    "get_mirai_stance",
    {
      title: "チームみらいの賛否を取得",
      description:
        "指定議案に対するチームみらいの賛否スタンス(mirai_stances)を返す。未設定なら stance=null。publishAt は公開日時（null は即時公開）。差分反映（既に同じ賛否が設定済みなら再提案・再反映しない）の判定に使う。",
      inputSchema: {
        billId: z.string().uuid(),
      },
    },
    async ({ billId }) => {
      const stance = await findStanceByBillId(billId);
      return jsonResult({
        billId,
        stance: stance
          ? {
              type: stance.type,
              comment: stance.comment,
              publishAt: stance.publish_at,
            }
          : null,
      });
    }
  );

  server.registerTool(
    "upsert_mirai_stance",
    {
      title: "チームみらいの賛否を設定",
      description:
        "指定議案に対するチームみらいの賛否スタンスをupsertする（1議案につき1件）。既存スタンスがあれば type / comment を更新し、なければ新規作成する。type は for / against / neutral / conditional_for / conditional_against / considering / continued_deliberation のいずれか。publishAt に ISO 8601 日時（タイムゾーン付き）を指定するとその日時まで公開サイトに表示しない予約公開になり、null で即時公開、省略時は既存の公開日時を変更しない。",
      inputSchema: {
        billId: z.string().uuid(),
        ...stanceInputSchema.shape,
      },
    },
    async ({ billId, type, comment, publishAt }) => {
      // created は「新規か更新か」を呼び出し側（Slack bot）に伝えるための
      // best-effort な情報。実際の書き込みは upsertMiraiStance が
      // onConflict(bill_id) で atomic に行う。事前 read が失敗しても created の
      // 精度が落ちるだけで、書き込み自体はブロックしない。
      let existing: Awaited<ReturnType<typeof findStanceByBillId>> = null;
      try {
        existing = await findStanceByBillId(billId);
      } catch {
        // best-effort: read 失敗時は created を判定できないため未知扱い
      }
      await upsertMiraiStance(billId, { type, comment, publishAt });
      await invalidateBillsCache();
      return jsonResult({ ok: true, created: existing === null, type });
    }
  );
}
