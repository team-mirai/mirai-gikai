import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { findBillIdById } from "@/features/bills-edit/server/repositories/bill-edit-repository";
import { closePublicInterviews } from "@/features/interview-config/server/services/close-public-interviews";
import { jsonResult } from "../utils/json-result";

export function registerInterviewTools(server: McpServer): void {
  server.registerTool(
    "close_bill_interviews",
    {
      title: "議案の AI インタビューを閉じる",
      description:
        "指定議案の公開中の AI インタビューをすべて非公開（closed）にし、閉じた件数を closedInterviewCount で返す。公開中が無ければ 0 を返す（何もしない）。意見を集める必要がなくなった議案（法案成立など）に使う。議案が無ければ ok=false, reason=not_found を返す。",
      inputSchema: {
        billId: z.string().uuid(),
      },
    },
    async ({ billId }) => {
      if ((await findBillIdById(billId)) === null) {
        return jsonResult({ ok: false, reason: "not_found" });
      }
      const closedInterviewCount = await closePublicInterviews(billId);
      return jsonResult({ ok: true, billId, closedInterviewCount });
    }
  );
}
