import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerSupplementaryResolutionTools } from "../../admin/src/features/mcp/server/tools/register-supplementary-resolution-tools";
import {
  adminClient,
  cleanupTestBill,
  createTestBill,
} from "../supabase/utils";
import { createTestRegistry, type TestMcpRegistry } from "./utils";

type ResolutionOutput = {
  referenceUrl: string;
  stance: string;
  focusPoints: string | null;
  reason: string | null;
};

describe("MCP supplementary-resolution tools", () => {
  let registry: TestMcpRegistry;
  const billIds: string[] = [];

  beforeEach(() => {
    registry = createTestRegistry();
    registerSupplementaryResolutionTools(registry.asMcpServer());
  });

  afterEach(async () => {
    // bill_supplementary_resolutions は bills への ON DELETE CASCADE なので bill 削除で一緒に消える
    for (const id of billIds.splice(0)) await cleanupTestBill(id);
  });

  async function createBill() {
    const bill = await createTestBill();
    billIds.push(bill.id);
    return bill;
  }

  it("未設定の議案は resolution=null を返す", async () => {
    const bill = await createBill();

    const result = await registry.callTool<{
      resolution: ResolutionOutput | null;
    }>("get_supplementary_resolution", { billId: bill.id });

    expect(result.resolution).toBeNull();
  });

  it("登録した附帯決議を取得できる", async () => {
    const bill = await createBill();

    await registry.callTool("upsert_supplementary_resolution", {
      billId: bill.id,
      referenceUrl: "https://example.com/resolution",
      stance: "for",
      focusPoints: "施行後の検証",
      reason: "必要な配慮が盛り込まれているため",
    });
    const result = await registry.callTool<{
      resolution: ResolutionOutput | null;
    }>("get_supplementary_resolution", { billId: bill.id });

    expect(result.resolution).toMatchObject({
      referenceUrl: "https://example.com/resolution",
      stance: "for",
      focusPoints: "施行後の検証",
      reason: "必要な配慮が盛り込まれているため",
    });
  });

  it("再登録すると同じ行を上書きし、省略した任意項目は null になる", async () => {
    const bill = await createBill();

    await registry.callTool("upsert_supplementary_resolution", {
      billId: bill.id,
      referenceUrl: "https://example.com/first",
      stance: "for",
      focusPoints: "施行後の検証",
      reason: "理由",
    });
    const result = await registry.callTool<{
      ok: boolean;
      resolution: ResolutionOutput;
    }>("upsert_supplementary_resolution", {
      billId: bill.id,
      referenceUrl: "https://example.com/second",
      stance: "against",
    });

    expect(result.ok).toBe(true);
    expect(result.resolution).toMatchObject({
      referenceUrl: "https://example.com/second",
      stance: "against",
      focusPoints: null,
      reason: null,
    });
    const { data } = await adminClient
      .from("bill_supplementary_resolutions")
      .select("id")
      .eq("bill_id", bill.id);
    expect(data).toHaveLength(1);
  });

  it("http(s) 以外の参考リンクは受け付けない", async () => {
    const bill = await createBill();

    await expect(
      registry.callTool("upsert_supplementary_resolution", {
        billId: bill.id,
        referenceUrl: "javascript:alert(1)",
        stance: "for",
      })
    ).rejects.toThrow();
  });

  it("削除すると未設定に戻り、未設定の削除は not_found を返す", async () => {
    const bill = await createBill();
    await registry.callTool("upsert_supplementary_resolution", {
      billId: bill.id,
      referenceUrl: "https://example.com/resolution",
      stance: "for",
    });

    const deleted = await registry.callTool<{ ok: boolean }>(
      "delete_supplementary_resolution",
      { billId: bill.id }
    );
    const again = await registry.callTool<{ ok: boolean; reason: string }>(
      "delete_supplementary_resolution",
      { billId: bill.id }
    );

    expect(deleted.ok).toBe(true);
    expect(again).toEqual({ ok: false, reason: "not_found" });
    const { data } = await adminClient
      .from("bill_supplementary_resolutions")
      .select("id")
      .eq("bill_id", bill.id);
    expect(data).toHaveLength(0);
  });

  it("3つのツールを登録する", () => {
    expect(registry.toolNames().sort()).toEqual([
      "delete_supplementary_resolution",
      "get_supplementary_resolution",
      "upsert_supplementary_resolution",
    ]);
  });
});
