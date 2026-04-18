import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  createBillRecord,
  createBillsTags,
  deleteBillsTags,
  findBillById,
  findBillContentsByBillId,
  findBillsTagsByBillId,
  updateBillRecord,
  upsertBillContent,
} from "@/features/bills-edit/server/repositories/bill-edit-repository";
import {
  billCreateSchema,
  billUpdateSchema,
} from "@/features/bills-edit/shared/types";
import { billContentsUpdateSchema } from "@/features/bills-edit/shared/types/bill-contents";
import {
  findBillsWithDietSessions,
  updateBillPublishStatus,
} from "@/features/bills/server/repositories/bill-repository";
import { calculateSetDiff } from "@/lib/utils/calculate-set-diff";
import { invalidateBillsCache } from "../utils/invalidate-bills-cache";
import { jsonResult } from "../utils/json-result";

export function registerBillsTools(server: McpServer): void {
  server.registerTool(
    "list_bills",
    {
      title: "議案一覧を取得",
      description:
        "mirai議会adminに登録されている議案を返す。各議案にdiet_session名も含む。publish_status / status でフィルタ可能。",
      inputSchema: {
        publish_status: z
          .enum(["draft", "published", "coming_soon"])
          .optional()
          .describe("公開ステータスでフィルタ"),
        status: billUpdateSchema.shape.status
          .optional()
          .describe("審議ステータスでフィルタ"),
      },
    },
    async ({ publish_status, status }) => {
      const bills = await findBillsWithDietSessions();
      const filtered = bills.filter((bill) => {
        if (publish_status && bill.publish_status !== publish_status)
          return false;
        if (status && bill.status !== status) return false;
        return true;
      });
      return jsonResult(filtered);
    }
  );

  server.registerTool(
    "get_bill",
    {
      title: "議案詳細を取得",
      description:
        "指定IDの議案本体、bill_contents（ふつう/難しい）、紐づくtag_idを返す。",
      inputSchema: {
        billId: z.string().uuid(),
      },
    },
    async ({ billId }) => {
      const [bill, contents, tagIds] = await Promise.all([
        findBillById(billId),
        findBillContentsByBillId(billId),
        findBillsTagsByBillId(billId),
      ]);
      return jsonResult({ bill, contents, tagIds });
    }
  );

  server.registerTool(
    "create_bill",
    {
      title: "議案を作成",
      description:
        "billsテーブルに新しい議案を作成する。コンテンツやタグは別ツール（update_bill_contents / update_bill_tags）で後から設定する。",
      inputSchema: billCreateSchema.shape,
    },
    async (input) => {
      const inserted = await createBillRecord({
        ...input,
        submitted_date: input.submitted_date
          ? `${input.submitted_date}T00:00:00+09:00`
          : null,
      });
      await invalidateBillsCache();
      return jsonResult({ ok: true, bill: inserted });
    }
  );

  server.registerTool(
    "update_bill",
    {
      title: "議案を更新",
      description:
        "指定IDの議案のメタ情報（name, status, originating_house 等）を更新する。",
      inputSchema: {
        billId: z.string().uuid(),
        ...billUpdateSchema.shape,
      },
    },
    async ({ billId, ...rest }) => {
      await updateBillRecord(billId, {
        ...rest,
        submitted_date: rest.submitted_date
          ? `${rest.submitted_date}T00:00:00+09:00`
          : null,
        updated_at: new Date().toISOString(),
      });
      await invalidateBillsCache();
      return jsonResult({ ok: true });
    }
  );

  server.registerTool(
    "update_bill_publish_status",
    {
      title: "議案の公開ステータスを変更",
      description:
        "議案の publish_status を draft / published / coming_soon に変更する。",
      inputSchema: {
        billId: z.string().uuid(),
        publishStatus: z.enum(["draft", "published", "coming_soon"]),
      },
    },
    async ({ billId, publishStatus }) => {
      await updateBillPublishStatus(billId, publishStatus);
      await invalidateBillsCache();
      return jsonResult({ ok: true });
    }
  );

  server.registerTool(
    "update_bill_contents",
    {
      title: "議案のコンテンツを更新",
      description:
        "議案のコンテンツ（title/summary/content）を difficulty=normal / hard ごとにupsertする。空文字のみの難易度はスキップ。",
      inputSchema: {
        billId: z.string().uuid(),
        ...billContentsUpdateSchema.shape,
      },
    },
    async ({ billId, normal, hard }) => {
      const byDifficulty = { normal, hard } as const;
      await Promise.all(
        (["normal", "hard"] as const).map(async (difficulty) => {
          const data = byDifficulty[difficulty];
          if (!data.title && !data.summary && !data.content) return;
          await upsertBillContent({
            billId,
            difficultyLevel: difficulty,
            title: data.title,
            summary: data.summary,
            content: data.content,
          });
        })
      );
      await invalidateBillsCache();
      return jsonResult({ ok: true });
    }
  );

  server.registerTool(
    "update_bill_tags",
    {
      title: "議案のタグを更新",
      description:
        "議案に紐づくタグIDの集合を指定の集合に差し替える（差分のみinsert/delete）。",
      inputSchema: {
        billId: z.string().uuid(),
        tagIds: z.array(z.string().uuid()),
      },
    },
    async ({ billId, tagIds }) => {
      const existingTagIds = await findBillsTagsByBillId(billId);
      const { toAdd, toDelete } = calculateSetDiff(existingTagIds, tagIds);
      if (toDelete.length > 0) {
        await deleteBillsTags(billId, toDelete);
      }
      if (toAdd.length > 0) {
        await createBillsTags(billId, toAdd);
      }
      await invalidateBillsCache();
      return jsonResult({ ok: true, added: toAdd, removed: toDelete });
    }
  );
}
