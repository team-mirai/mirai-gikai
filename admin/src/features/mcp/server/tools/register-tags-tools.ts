import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  createTagRecord,
  findAllTagsWithBillCount,
  updateTagRecord,
} from "@/features/tags/server/repositories/tag-repository";
import { mapTagDbError } from "@/features/tags/shared/utils/map-tag-db-error";
import { invalidateBillsCache } from "../utils/invalidate-bills-cache";
import { jsonResult } from "../utils/json-result";

export function registerTagsTools(server: McpServer): void {
  server.registerTool(
    "list_tags",
    {
      title: "タグ一覧を取得",
      description:
        "adminに登録されているすべてのタグを返す。各タグの紐づき議案数(bill_count)も含む。",
      inputSchema: {},
    },
    async () => {
      const tags = await findAllTagsWithBillCount();
      return jsonResult(tags);
    }
  );

  server.registerTool(
    "create_tag",
    {
      title: "タグを作成",
      description:
        "新しいタグを作成する。labelは必須。description / featured_priority は任意。",
      inputSchema: {
        label: z.string().min(1),
        description: z.string().nullable().optional(),
        featured_priority: z.number().int().nullable().optional(),
      },
    },
    async ({ label, description, featured_priority }) => {
      const trimmed = label.trim();
      if (trimmed.length === 0) {
        return jsonResult({ ok: false, error: "タグ名を入力してください" });
      }
      const result = await createTagRecord({
        label: trimmed,
        description: description ?? null,
        featured_priority: featured_priority ?? null,
      });
      if (result.error) {
        return jsonResult({
          ok: false,
          error: mapTagDbError(result.error, "作成"),
        });
      }
      await invalidateBillsCache();
      return jsonResult({ ok: true, tag: result.data });
    }
  );

  server.registerTool(
    "update_tag",
    {
      title: "タグを更新",
      description:
        "指定IDのタグを更新する。label(必須) と任意で description / featured_priority を変更できる。",
      inputSchema: {
        id: z.string().uuid(),
        label: z.string().min(1),
        description: z.string().nullable().optional(),
        featured_priority: z.number().int().nullable().optional(),
      },
    },
    async ({ id, label, description, featured_priority }) => {
      const trimmed = label.trim();
      if (trimmed.length === 0) {
        return jsonResult({ ok: false, error: "タグ名を入力してください" });
      }
      const result = await updateTagRecord(id, {
        label: trimmed,
        description: description ?? null,
        featured_priority: featured_priority ?? null,
      });
      if (result.error) {
        return jsonResult({
          ok: false,
          error: mapTagDbError(result.error, "更新"),
        });
      }
      await invalidateBillsCache();
      return jsonResult({ ok: true, tag: result.data });
    }
  );
}
