import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerInterviewTools } from "../../admin/src/features/mcp/server/tools/register-interview-tools";
import {
  adminClient,
  cleanupTestBill,
  createTestBill,
} from "../supabase/utils";
import { createTestRegistry, type TestMcpRegistry } from "./utils";

describe("MCP interview tools", () => {
  let registry: TestMcpRegistry;
  const billIds: string[] = [];

  beforeEach(() => {
    registry = createTestRegistry();
    registerInterviewTools(registry.asMcpServer());
  });

  afterEach(async () => {
    // interview_configs は bills への ON DELETE CASCADE なので bill 削除で一緒に消える
    for (const id of billIds.splice(0)) await cleanupTestBill(id);
  });

  async function createBill() {
    const bill = await createTestBill();
    billIds.push(bill.id);
    return bill;
  }

  async function createConfig(billId: string, status: "public" | "closed") {
    const { data, error } = await adminClient
      .from("interview_configs")
      .insert({ bill_id: billId, status, name: `テスト設定 ${status}` })
      .select("id")
      .single();
    if (error || !data)
      throw new Error(`interview_config 作成失敗: ${error?.message}`);
    return data.id;
  }

  async function statusOf(configId: string) {
    const { data } = await adminClient
      .from("interview_configs")
      .select("status")
      .eq("id", configId)
      .single();
    return data?.status;
  }

  it("公開中のインタビューを閉じ、閉じた件数を返す", async () => {
    const bill = await createBill();
    const open = await createConfig(bill.id, "public");
    const closed = await createConfig(bill.id, "closed");

    const result = await registry.callTool("close_bill_interviews", {
      billId: bill.id,
    });

    expect(result).toEqual({
      ok: true,
      billId: bill.id,
      closedInterviewCount: 1,
    });
    expect(await statusOf(open)).toBe("closed");
    expect(await statusOf(closed)).toBe("closed");
  });

  it("公開中のインタビューが無ければ 0 を返す", async () => {
    const bill = await createBill();

    const result = await registry.callTool("close_bill_interviews", {
      billId: bill.id,
    });

    expect(result).toEqual({
      ok: true,
      billId: bill.id,
      closedInterviewCount: 0,
    });
  });

  it("ほかの議案のインタビューは閉じない", async () => {
    const bill = await createBill();
    const other = await createBill();
    const otherOpen = await createConfig(other.id, "public");

    await registry.callTool("close_bill_interviews", { billId: bill.id });

    expect(await statusOf(otherOpen)).toBe("public");
  });

  it("存在しない議案は not_found を返す", async () => {
    const result = await registry.callTool("close_bill_interviews", {
      billId: "00000000-0000-4000-8000-000000000000",
    });

    expect(result).toEqual({ ok: false, reason: "not_found" });
  });
});
