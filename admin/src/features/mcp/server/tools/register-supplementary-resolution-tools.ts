import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  deleteSupplementaryResolutionByHouse,
  findSupplementaryResolutionsByBillId,
  upsertSupplementaryResolution,
} from "@/features/supplementary-resolution/server/repositories/supplementary-resolution-repository";
import {
  type SupplementaryResolution,
  supplementaryResolutionHouseSchema,
  supplementaryResolutionInputSchema,
} from "@/features/supplementary-resolution/shared/types";
import { jsonResult } from "../utils/json-result";

function toToolOutput(resolution: SupplementaryResolution) {
  return {
    house: resolution.house,
    referenceUrl: resolution.reference_url,
    content: resolution.content,
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
        "指定議案に付された附帯決議と、それに対するチームみらいの賛否を院ごとに返す。resolutions は登録済みの院の分だけ（衆議院→参議院の順、未設定なら空配列）。house は附帯決議を付した院（HR=衆議院 / HC=参議院）、referenceUrl は附帯決議の内容を確認できる参考リンク、content は附帯決議の内容（自由記述）、stance は for（賛成）/ against（反対）、referenceUrl・content・focusPoints・reason は未設定なら null。",
      inputSchema: {
        billId: z.string().uuid(),
      },
    },
    async ({ billId }) => {
      const resolutions = await findSupplementaryResolutionsByBillId(billId);
      return jsonResult({
        billId,
        resolutions: resolutions.map(toToolOutput),
      });
    }
  );

  server.registerTool(
    "upsert_supplementary_resolution",
    {
      title: "附帯決議を登録・更新",
      description:
        "指定議案の附帯決議を院ごとに登録する（1議案につき院ごとに1件。同じ院に既にあれば上書き）。house（HR=衆議院 / HC=参議院）と stance（for=賛成 / against=反対）は必須。referenceUrl（参考リンク。入れる場合は http(s) の URL）、content（附帯決議の内容。自由記述のテキスト）、focusPoints（重視した事項）、reason（理由）は任意で、省略・空文字は未設定（null）として保存する。上書き時も省略した項目は null になる。",
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
        "指定議案の、指定した院（HR=衆議院 / HC=参議院）の附帯決議を削除する。もう一方の院の附帯決議は残る。未設定なら ok=false, reason=not_found を返す。",
      inputSchema: {
        billId: z.string().uuid(),
        house: supplementaryResolutionHouseSchema,
      },
    },
    async ({ billId, house }) => {
      const deleted = await deleteSupplementaryResolutionByHouse(billId, house);
      if (!deleted) {
        return jsonResult({ ok: false, reason: "not_found" });
      }
      return jsonResult({ ok: true, billId, house });
    }
  );
}
