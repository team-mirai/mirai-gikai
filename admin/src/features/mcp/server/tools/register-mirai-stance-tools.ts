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
    "upsert_mirai_stance",
    {
      title: "チームみらいの賛否を設定",
      description:
        "指定議案に対するチームみらいの賛否スタンスをupsertする（1議案につき1件）。既存スタンスがあれば type / comment を更新し、なければ新規作成する。type は for / against / neutral / conditional_for / conditional_against / considering / continued_deliberation のいずれか。",
      inputSchema: {
        billId: z.string().uuid(),
        ...stanceInputSchema.shape,
      },
    },
    async ({ billId, type, comment }) => {
      // created は「新規か更新か」を呼び出し側（Slack bot）に伝えるための
      // best-effort な情報。実際の書き込みは upsertMiraiStance が
      // onConflict(bill_id) で atomic に行うため、この事前 read は正しさに影響しない。
      const existing = await findStanceByBillId(billId);
      await upsertMiraiStance(billId, { type, comment });
      await invalidateBillsCache();
      return jsonResult({ ok: true, created: existing === null, type });
    }
  );
}
