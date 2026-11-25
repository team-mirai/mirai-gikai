import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  deleteSupplementaryResolutionByHouse,
  findSupplementaryResolutionsByBillId,
  publishSupplementaryResolutionIfUnchanged,
  upsertSupplementaryResolution,
} from "@/features/supplementary-resolution/server/repositories/supplementary-resolution-repository";
import {
  type SupplementaryResolution,
  supplementaryResolutionHouseSchema,
  supplementaryResolutionInputSchema,
} from "@/features/supplementary-resolution/shared/types";
import { invalidateBillsCache } from "../utils/invalidate-bills-cache";
import { jsonResult } from "../utils/json-result";

function toToolOutput(resolution: SupplementaryResolution) {
  return {
    house: resolution.house,
    referenceUrl: resolution.reference_url,
    content: resolution.content,
    stance: resolution.stance,
    focusPoints: resolution.focus_points,
    reason: resolution.reason,
    isPublished: resolution.is_published,
    updatedAt: resolution.updated_at,
  };
}

export function registerSupplementaryResolutionTools(server: McpServer): void {
  server.registerTool(
    "get_supplementary_resolution",
    {
      title: "附帯決議を取得",
      description:
        "指定議案に付された附帯決議と、それに対するチームみらいの賛否を院ごとに返す。resolutions は登録済みの院の分だけ（衆議院→参議院の順、未設定なら空配列）。house は附帯決議を付した院（HR=衆議院 / HC=参議院）、referenceUrl は附帯決議の内容を確認できる参考リンク、content は附帯決議の内容（自由記述）、stance は for（賛成）/ against（反対）、referenceUrl・content・focusPoints・reason は未設定なら null。isPublished は公開/非公開（false は公開サイトに表示しない）、updatedAt は最終更新日時（publish_supplementary_resolution の expectedUpdatedAt に渡す）。",
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
        "指定議案の附帯決議を院ごとに登録する（1議案につき院ごとに1件。同じ院に既にあれば上書き）。house（HR=衆議院 / HC=参議院）と stance（for=賛成 / against=反対）は必須。referenceUrl（参考リンク。入れる場合は http(s) の URL）、content（附帯決議の内容。自由記述のテキスト）、focusPoints（重視した事項）、reason（理由）は任意で、省略・空文字は未設定（null）として保存する。上書き時も省略した項目は null になる。isPublished（公開するか）は省略すると、新規は非公開、既存は今の公開/非公開のまま。",
      inputSchema: {
        billId: z.string().uuid(),
        ...supplementaryResolutionInputSchema.shape,
      },
    },
    async ({ billId, ...input }) => {
      const resolution = await upsertSupplementaryResolution(billId, input);
      await invalidateBillsCache();
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
      await invalidateBillsCache();
      return jsonResult({ ok: true, billId, house });
    }
  );

  server.registerTool(
    "publish_supplementary_resolution",
    {
      title: "附帯決議を公開",
      description:
        "指定議案の、指定した院（HR=衆議院 / HC=参議院）の非公開の附帯決議を公開する。expectedUpdatedAt には公開確認時点の updatedAt を渡し、それ以降に内容が書き換わっていた場合は公開せず ok=false, reason=stale を返す。reason は not_found（未設定）/ already_published（公開済み）/ stale のいずれか。",
      inputSchema: {
        billId: z.string().uuid(),
        house: supplementaryResolutionHouseSchema,
        expectedUpdatedAt: z.string().datetime({ offset: true }),
      },
    },
    async ({ billId, house, expectedUpdatedAt }) => {
      const published = await publishSupplementaryResolutionIfUnchanged(
        billId,
        house,
        expectedUpdatedAt
      );
      if (!published) {
        const current = (
          await findSupplementaryResolutionsByBillId(billId)
        ).find((r) => r.house === house);
        const reason = !current
          ? "not_found"
          : current.is_published
            ? "already_published"
            : "stale";
        return jsonResult({ ok: false, reason });
      }
      await invalidateBillsCache();
      return jsonResult({ ok: true, billId, house });
    }
  );
}
