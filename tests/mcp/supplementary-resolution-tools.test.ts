import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerSupplementaryResolutionTools } from "../../admin/src/features/mcp/server/tools/register-supplementary-resolution-tools";
import {
  adminClient,
  cleanupTestBill,
  createTestBill,
} from "../supabase/utils";
import { createTestRegistry, type TestMcpRegistry } from "./utils";

type ResolutionOutput = {
  house: string;
  referenceUrl: string;
  content: string | null;
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

  async function getResolutions(billId: string) {
    const result = await registry.callTool<{
      resolutions: ResolutionOutput[];
    }>("get_supplementary_resolution", { billId });
    return result.resolutions;
  }

  it("未設定の議案は空の配列を返す", async () => {
    const bill = await createBill();

    expect(await getResolutions(bill.id)).toEqual([]);
  });

  it("登録した附帯決議を取得できる", async () => {
    const bill = await createBill();

    await registry.callTool("upsert_supplementary_resolution", {
      billId: bill.id,
      house: "HC",
      referenceUrl: "https://example.com/resolution",
      content: "政府は施行状況を検証し、必要な措置を講ずること。",
      stance: "for",
      focusPoints: "施行後の検証",
      reason: "必要な配慮が盛り込まれているため",
    });

    expect(await getResolutions(bill.id)).toMatchObject([
      {
        house: "HC",
        referenceUrl: "https://example.com/resolution",
        content: "政府は施行状況を検証し、必要な措置を講ずること。",
        stance: "for",
        focusPoints: "施行後の検証",
        reason: "必要な配慮が盛り込まれているため",
      },
    ]);
  });

  it("衆議院と参議院の附帯決議を別々に持ち、衆議院→参議院の順で返す", async () => {
    const bill = await createBill();

    await registry.callTool("upsert_supplementary_resolution", {
      billId: bill.id,
      house: "HC",
      referenceUrl: "https://example.com/hc",
      stance: "against",
    });
    await registry.callTool("upsert_supplementary_resolution", {
      billId: bill.id,
      house: "HR",
      referenceUrl: "https://example.com/hr",
      stance: "for",
    });

    expect(await getResolutions(bill.id)).toMatchObject([
      { house: "HR", referenceUrl: "https://example.com/hr", stance: "for" },
      {
        house: "HC",
        referenceUrl: "https://example.com/hc",
        stance: "against",
      },
    ]);
  });

  it("同じ院に再登録すると同じ行を上書きし、省略した任意項目は null になる", async () => {
    const bill = await createBill();

    await registry.callTool("upsert_supplementary_resolution", {
      billId: bill.id,
      house: "HR",
      referenceUrl: "https://example.com/first",
      content: "一回目の内容",
      stance: "for",
      focusPoints: "施行後の検証",
      reason: "理由",
    });
    const result = await registry.callTool<{
      ok: boolean;
      resolution: ResolutionOutput;
    }>("upsert_supplementary_resolution", {
      billId: bill.id,
      house: "HR",
      referenceUrl: "https://example.com/second",
      stance: "against",
    });

    expect(result.ok).toBe(true);
    expect(result.resolution).toMatchObject({
      house: "HR",
      referenceUrl: "https://example.com/second",
      content: null,
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
        house: "HR",
        referenceUrl: "javascript:alert(1)",
        stance: "for",
      })
    ).rejects.toThrow();
  });

  it("院を指定しない登録は受け付けない", async () => {
    const bill = await createBill();

    await expect(
      registry.callTool("upsert_supplementary_resolution", {
        billId: bill.id,
        referenceUrl: "https://example.com/resolution",
        stance: "for",
      })
    ).rejects.toThrow();
  });

  it("削除は指定した院だけを消し、未設定の院の削除は not_found を返す", async () => {
    const bill = await createBill();
    for (const house of ["HR", "HC"]) {
      await registry.callTool("upsert_supplementary_resolution", {
        billId: bill.id,
        house,
        referenceUrl: "https://example.com/resolution",
        stance: "for",
      });
    }

    const deleted = await registry.callTool("delete_supplementary_resolution", {
      billId: bill.id,
      house: "HR",
    });
    const again = await registry.callTool<{ ok: boolean; reason: string }>(
      "delete_supplementary_resolution",
      { billId: bill.id, house: "HR" }
    );

    expect(deleted).toEqual({ ok: true, billId: bill.id, house: "HR" });
    expect(again).toEqual({ ok: false, reason: "not_found" });
    expect(await getResolutions(bill.id)).toMatchObject([{ house: "HC" }]);
  });

  // 院を指定し忘れた削除で、もう一方の院の附帯決議まで消えないこと
  it("院を指定しない削除は受け付けない", async () => {
    const bill = await createBill();
    await registry.callTool("upsert_supplementary_resolution", {
      billId: bill.id,
      house: "HR",
      referenceUrl: "https://example.com/resolution",
      stance: "for",
    });

    await expect(
      registry.callTool("delete_supplementary_resolution", { billId: bill.id })
    ).rejects.toThrow();
    expect(await getResolutions(bill.id)).toHaveLength(1);
  });

  it("3つのツールを登録する", () => {
    expect(registry.toolNames().sort()).toEqual([
      "delete_supplementary_resolution",
      "get_supplementary_resolution",
      "upsert_supplementary_resolution",
    ]);
  });
});
