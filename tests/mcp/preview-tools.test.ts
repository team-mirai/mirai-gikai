import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerPreviewTools } from "../../admin/src/features/mcp/server/tools/register-preview-tools";
import {
  adminClient,
  cleanupTestBill,
  createTestBill,
} from "../supabase/utils";
import { createTestRegistry, type TestMcpRegistry } from "./utils";

describe("MCP preview tools", () => {
  let registry: TestMcpRegistry;
  const billIds: string[] = [];

  beforeEach(() => {
    registry = createTestRegistry();
    registerPreviewTools(registry.asMcpServer());
  });

  afterEach(async () => {
    // preview_tokens は bills の CASCADE で自動削除される
    for (const id of billIds.splice(0)) await cleanupTestBill(id);
  });

  describe("generate_preview_url", () => {
    it("type=bill のとき /preview/bills/:id にトークン付きURLを返す", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);

      // 失効日時の検証は呼び出し前後の Date.now() を基準にして範囲比較する。
      const before = Date.now();
      const result = await registry.callTool<{
        ok: boolean;
        url: string;
        token: string;
        expiresAt: string;
      }>("generate_preview_url", { billId: bill.id, type: "bill" });
      const after = Date.now();

      expect(result.ok).toBe(true);
      expect(result.token).toMatch(/^[0-9a-f]{64}$/);
      expect(result.url).toContain(
        `/preview/bills/${bill.id}?token=${result.token}`
      );
      expect(result.url).not.toContain("/interview");
      // 30日有効
      const day = 24 * 60 * 60 * 1000;
      const expiresAt = new Date(result.expiresAt).getTime();
      expect(expiresAt - before).toBeGreaterThanOrEqual(30 * day - 1000);
      expect(expiresAt - after).toBeLessThanOrEqual(30 * day + 1000);
    });

    it("type=interview のとき /preview/bills/:id/interview を返す", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);

      const result = await registry.callTool<{ url: string }>(
        "generate_preview_url",
        { billId: bill.id, type: "interview" }
      );
      expect(result.url).toContain(
        `/preview/bills/${bill.id}/interview?token=`
      );
    });

    it("type を省略すると bill 扱いになる", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);

      const result = await registry.callTool<{ url: string }>(
        "generate_preview_url",
        { billId: bill.id }
      );
      expect(result.url).toContain(`/preview/bills/${bill.id}?token=`);
      expect(result.url).not.toContain("/interview");
    });

    it("既存の有効トークンがあれば再利用する", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);

      const first = await registry.callTool<{
        token: string;
        expiresAt: string;
      }>("generate_preview_url", { billId: bill.id, type: "bill" });
      const second = await registry.callTool<{
        token: string;
        expiresAt: string;
      }>("generate_preview_url", { billId: bill.id, type: "interview" });
      expect(second.token).toBe(first.token);
      // 既存トークンを再利用するので expires_at も延長されない（瞬間時刻として比較）
      expect(new Date(second.expiresAt).getTime()).toBe(
        new Date(first.expiresAt).getTime()
      );

      // DB に1件だけのはず
      const { data } = await adminClient
        .from("preview_tokens")
        .select("token")
        .eq("bill_id", bill.id);
      expect(data).toHaveLength(1);
    });
  });

  it("登録されているツール名が想定通り", () => {
    expect(registry.toolNames()).toEqual(["generate_preview_url"]);
  });
});
