import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { BillMilestoneFact } from "../../admin/src/features/bill-milestones/shared/types";
import { registerBillMilestoneTools } from "../../admin/src/features/mcp/server/tools/register-bill-milestone-tools";
import type { Database } from "../../packages/supabase/types/supabase.types";
import {
  adminClient,
  cleanupTestBill,
  createTestBill,
  createTestMiraiStance,
} from "../supabase/utils";
import { createTestRegistry, type TestMcpRegistry } from "./utils";

// 速報画像のロゴは Next.js の実行時と同じく admin/ を起点に読む（パスは import 時に決まる）ため、
// import より前に cwd を合わせる
const originalCwd = vi.hoisted(() => {
  const cwd = process.cwd();
  process.chdir(new URL("../../admin", import.meta.url).pathname);
  return cwd;
});

afterAll(() => {
  process.chdir(originalCwd);
});

type BillUpdate = Database["public"]["Tables"]["bills"]["Update"];

async function updateBill(billId: string, patch: BillUpdate) {
  const { data, error } = await adminClient
    .from("bills")
    .update(patch)
    .eq("id", billId)
    .select("first_published_at, created_at")
    .single();
  if (error) throw new Error(`bill 更新失敗: ${error.message}`);
  return data;
}

async function createInterviewConfig(
  billId: string,
  status: "public" | "closed"
) {
  const { data, error } = await adminClient
    .from("interview_configs")
    .insert({ bill_id: billId, name: "テスト設定", status })
    .select("id, published_at")
    .single();
  if (error) throw new Error(`interview_config 作成失敗: ${error.message}`);
  return data;
}

/** DB の日時に 1ms 足す（since をその直後にするため） */
function justAfter(timestamp: string): string {
  return new Date(new Date(timestamp).getTime() + 1).toISOString();
}

describe("MCP bill milestone tools", () => {
  let registry: TestMcpRegistry;
  const billIds: string[] = [];

  /** テスト後に削除する法案を作る */
  async function createBill(overrides: Parameters<typeof createTestBill>[0]) {
    const bill = await createTestBill(overrides);
    billIds.push(bill.id);
    return bill;
  }

  async function listFacts(since: string) {
    return await registry.callTool<{ bills: BillMilestoneFact[] }>(
      "list_bill_milestone_facts",
      { since }
    );
  }

  beforeEach(() => {
    registry = createTestRegistry();
    registerBillMilestoneTools(registry.asMcpServer());
  });

  afterEach(async () => {
    // 関連テーブルは bills への ON DELETE CASCADE なので bill 削除で一緒に消える
    for (const id of billIds.splice(0)) await cleanupTestBill(id);
  });

  describe("list_bill_milestone_facts", () => {
    it("since より前の節目しかない法案は返らず、since 以降の節目だけを返す", async () => {
      const oldBill = await createBill({ publish_status: "published" });
      const since = justAfter(oldBill.first_published_at ?? "");
      // DB の時刻が since を確実に越えるまで待つ
      await new Promise((resolve) => setTimeout(resolve, 10));

      const newBill = await createBill({
        publish_status: "published",
        status: "introduced",
      });
      await updateBill(newBill.id, { status: "in_originating_house" });

      const result = await listFacts(since);
      expect(result.bills.map((bill) => bill.billId)).not.toContain(oldBill.id);

      const fact = result.bills.find((bill) => bill.billId === newBill.id);
      expect(fact?.firstPublishedAt).not.toBeNull();
      expect(fact?.statusChanges.map(({ from, to }) => ({ from, to }))).toEqual(
        [
          { from: null, to: "introduced" },
          { from: "introduced", to: "in_originating_house" },
        ]
      );
      expect(fact?.stance).toBeNull();
      expect(fact?.interview).toEqual({ isPublic: false, publishedAt: null });
    });

    it("予約公開でまだ時刻が来ていない賛否は isPublished: false で、publishedAt は予約公開日時", async () => {
      const bill = await createBill({ publish_status: "draft" });
      const publishAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await createTestMiraiStance(bill.id, {
        is_published: true,
        publish_at: publishAt.toISOString(),
      });

      const result = await listFacts(bill.created_at);
      const fact = result.bills.find((b) => b.billId === bill.id);
      expect(fact?.stance?.isPublished).toBe(false);
      expect(new Date(fact?.stance?.publishedAt ?? "").getTime()).toBe(
        publishAt.getTime()
      );
    });

    it("公開中のインタビューを返す", async () => {
      const bill = await createBill({ publish_status: "draft" });
      await createInterviewConfig(bill.id, "public");

      const result = await listFacts(bill.created_at);
      const fact = result.bills.find((b) => b.billId === bill.id);
      expect(fact?.interview.isPublic).toBe(true);
      expect(fact?.interview.publishedAt).not.toBeNull();
    });
  });

  describe("render_breaking_news_image", () => {
    const baseInput = {
      result: "可決",
      reachedStep: 1,
      title: "テスト法案が可決",
      includeStance: false,
    };

    it("PNG の image content を返す", async () => {
      const bill = await createBill({});

      const result = await registry.callToolResult(
        "render_breaking_news_image",
        { ...baseInput, billId: bill.id, place: "衆議院本会議" }
      );
      expect(result.isError).toBeUndefined();
      const [content] = result.content;
      expect(content?.type).toBe("image");
      if (content?.type !== "image") return;
      expect(content.mimeType).toBe("image/png");
      // PNG のシグネチャ
      expect(
        Buffer.from(content.data, "base64").subarray(0, 8).toString("hex")
      ).toBe("89504e470d0a1a0a");
    });

    it("結果と進み具合の組み合わせが不正なら isError を返す", async () => {
      const bill = await createBill({});

      const result = await registry.callToolResult(
        "render_breaking_news_image",
        { ...baseInput, billId: bill.id, result: "成立" }
      );
      expect(result.isError).toBe(true);
      expect(result.content).toEqual([
        { type: "text", text: "結果と進み具合の組み合わせが合っていません" },
      ]);
    });

    it("法案が無ければ isError を返す", async () => {
      const result = await registry.callToolResult(
        "render_breaking_news_image",
        { ...baseInput, billId: "00000000-0000-4000-8000-000000000000" }
      );
      expect(result.isError).toBe(true);
    });
  });
});
