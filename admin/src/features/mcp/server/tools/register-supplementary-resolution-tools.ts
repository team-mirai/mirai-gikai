import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  deleteSupplementaryResolutionByBillId,
  findSupplementaryResolutionByBillId,
  upsertSupplementaryResolution,
} from "@/features/supplementary-resolution/server/repositories/supplementary-resolution-repository";
import {
  type SupplementaryResolution,
  supplementaryResolutionInputSchema,
} from "@/features/supplementary-resolution/shared/types";
import { jsonResult } from "../utils/json-result";

function toToolOutput(resolution: SupplementaryResolution) {
  return {
    referenceUrl: resolution.reference_url,
    stance: resolution.stance,
    focusPoints: resolution.focus_points,
    reason: resolution.reason,
    updatedAt: resolution.updated_at,
  };
}

export function registerSupplementaryResolutionTools(server: McpServer): void {
  server.registerTool(
    "get_supplementary_resolution",
    {
      title: "附帯決議を取得",
      description:
        "指定議案に付された附帯決議と、それに対するチームみらいの賛否を返す。未設定なら resolution=null。referenceUrl は附帯決議の内容を確認できる参考リンク、stance は for（賛成）/ against（反対）、focusPoints は附帯決議で重視した事項、reason は理由（いずれも未設定なら null）。",
      inputSchema: {
        billId: z.string().uuid(),
      },
    },
    async ({ billId }) => {
      const resolution = await findSupplementaryResolutionByBillId(billId);
      return jsonResult({
        billId,
        resolution: resolution ? toToolOutput(resolution) : null,
      });
    }
  );

  server.registerTool(
    "upsert_supplementary_resolution",
    {
      title: "附帯決議を登録・更新",
      description:
        "指定議案の附帯決議を登録する（1議案1件。既にあれば上書き）。referenceUrl（http(s) の参考リンク）と stance（for=賛成 / against=反対）は必須。focusPoints（重視した事項）と reason（理由）は任意で、省略・空文字は未設定（null）として保存する。上書き時も省略した項目は null になる。",
      inputSchema: {
        billId: z.string().uuid(),
        ...supplementaryResolutionInputSchema.shape,
      },
    },
    async ({ billId, ...input }) => {
      const resolution = await upsertSupplementaryResolution(billId, input);
      return jsonResult({
        ok: true,
        billId,
        resolution: toToolOutput(resolution),
      });
    }
  );

  server.registerTool(
    "delete_supplementary_resolution",
    {
      title: "附帯決議を削除",
      description:
        "指定議案の附帯決議を削除する。未設定なら ok=false, reason=not_found を返す。",
      inputSchema: {
        billId: z.string().uuid(),
      },
    },
    async ({ billId }) => {
      const deleted = await deleteSupplementaryResolutionByBillId(billId);
      if (!deleted) {
        return jsonResult({ ok: false, reason: "not_found" });
      }
      return jsonResult({ ok: true, billId });
    }
  );
}
