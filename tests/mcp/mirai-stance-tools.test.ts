import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerMiraiStanceTools } from "../../admin/src/features/mcp/server/tools/register-mirai-stance-tools";
import {
  adminClient,
  cleanupTestBill,
  createTestBill,
} from "../supabase/utils";
import { createTestRegistry, type TestMcpRegistry } from "./utils";

describe("MCP mirai-stance tools", () => {
  let registry: TestMcpRegistry;
  const billIds: string[] = [];

  beforeEach(() => {
    registry = createTestRegistry();
    registerMiraiStanceTools(registry.asMcpServer());
  });

  afterEach(async () => {
    // mirai_stances は bills への ON DELETE CASCADE なので bill 削除で一緒に消える
    for (const id of billIds.splice(0)) await cleanupTestBill(id);
  });

  describe("upsert_mirai_stance", () => {
    it("スタンスが無い議案には新規作成する（created: true）", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);

      const result = await registry.callTool<{
        ok: boolean;
        created: boolean;
        type: string;
      }>("upsert_mirai_stance", {
        billId: bill.id,
        type: "for",
        comment: "賛成コメント",
      });
      expect(result.ok).toBe(true);
      expect(result.created).toBe(true);
      expect(result.type).toBe("for");

      const { data } = await adminClient
        .from("mirai_stances")
        .select("type, comment")
        .eq("bill_id", bill.id)
        .single();
      expect(data?.type).toBe("for");
      expect(data?.comment).toBe("賛成コメント");
    });

    it("既存スタンスがあれば type / comment を更新する（created: false、行IDは同一）", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);

      await registry.callTool("upsert_mirai_stance", {
        billId: bill.id,
        type: "for",
        comment: "最初のコメント",
      });
      const { data: before } = await adminClient
        .from("mirai_stances")
        .select("id")
        .eq("bill_id", bill.id)
        .single();

      const result = await registry.callTool<{
        created: boolean;
        type: string;
      }>("upsert_mirai_stance", {
        billId: bill.id,
        type: "against",
        comment: "変更後のコメント",
      });
      expect(result.created).toBe(false);
      expect(result.type).toBe("against");

      const { data: after } = await adminClient
        .from("mirai_stances")
        .select("id, type, comment")
        .eq("bill_id", bill.id)
        .single();
      // UNIQUE(bill_id) なので行は増えず、同じ行が更新される
      expect(after?.id).toBe(before?.id);
      expect(after?.type).toBe("against");
      expect(after?.comment).toBe("変更後のコメント");
    });

    it("comment を省略すると null で保存する", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);

      await registry.callTool("upsert_mirai_stance", {
        billId: bill.id,
        type: "neutral",
      });

      const { data } = await adminClient
        .from("mirai_stances")
        .select("comment")
        .eq("bill_id", bill.id)
        .single();
      expect(data?.comment).toBeNull();
    });
  });

  it("登録されているツール名が想定通り", () => {
    expect(registry.toolNames().sort()).toEqual(["upsert_mirai_stance"]);
  });
});
