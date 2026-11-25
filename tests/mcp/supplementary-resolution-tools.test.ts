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
  referenceUrl: string | null;
  content: string | null;
  stance: string;
  focusPoints: string | null;
  reason: string | null;
  isPublished: boolean;
  updatedAt: string;
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

  it("参考リンクなしでも登録でき、未設定は null で返す", async () => {
    const bill = await createBill();

    const result = await registry.callTool<{
      ok: boolean;
      resolution: ResolutionOutput;
    }>("upsert_supplementary_resolution", {
      billId: bill.id,
      house: "HR",
      content: "政府は施行状況を検証し、必要な措置を講ずること。",
      stance: "for",
    });

    expect(result.ok).toBe(true);
    expect(result.resolution).toMatchObject({
      house: "HR",
      referenceUrl: null,
      content: "政府は施行状況を検証し、必要な措置を講ずること。",
    });
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

  describe("公開/非公開", () => {
    async function upsert(billId: string, extra: Record<string, unknown> = {}) {
      return registry.callTool<{ resolution: ResolutionOutput }>(
        "upsert_supplementary_resolution",
        { billId, house: "HR", stance: "for", content: "内容", ...extra }
      );
    }

    it("isPublished を省いた新規登録は非公開になる", async () => {
      const bill = await createBill();
      await upsert(bill.id);

      expect(await getResolutions(bill.id)).toMatchObject([
        { house: "HR", isPublished: false },
      ]);
    });

    it("isPublished を省いた上書きは、既存の公開/非公開を変えない", async () => {
      const bill = await createBill();
      await upsert(bill.id, { isPublished: true });
      await upsert(bill.id, { content: "書き換えた内容" });

      expect(await getResolutions(bill.id)).toMatchObject([
        { content: "書き換えた内容", isPublished: true },
      ]);
    });

    it("公開確認時点の updatedAt を渡すと公開する", async () => {
      const bill = await createBill();
      const { resolution } = await upsert(bill.id, { isPublished: false });

      const result = await registry.callTool(
        "publish_supplementary_resolution",
        {
          billId: bill.id,
          house: "HR",
          expectedUpdatedAt: resolution.updatedAt,
        }
      );

      expect(result).toEqual({ ok: true, billId: bill.id, house: "HR" });
      expect(await getResolutions(bill.id)).toMatchObject([
        { isPublished: true },
      ]);
    });

    it("公開確認の後に内容が書き換わっていたら公開しない（stale）", async () => {
      const bill = await createBill();
      const { resolution } = await upsert(bill.id, { isPublished: false });
      // updated_at はミリ秒精度なので、書き換えで値が変わるよう少し待つ
      await new Promise((r) => setTimeout(r, 5));
      await upsert(bill.id, { isPublished: false, content: "シートで直した" });

      const result = await registry.callTool(
        "publish_supplementary_resolution",
        {
          billId: bill.id,
          house: "HR",
          expectedUpdatedAt: resolution.updatedAt,
        }
      );

      expect(result).toEqual({ ok: false, reason: "stale" });
      expect(await getResolutions(bill.id)).toMatchObject([
        { isPublished: false },
      ]);
    });

    it("公開済み・未設定はそれぞれ already_published / not_found を返す", async () => {
      const bill = await createBill();
      const { resolution } = await upsert(bill.id, { isPublished: true });

      const published = await registry.callTool(
        "publish_supplementary_resolution",
        {
          billId: bill.id,
          house: "HR",
          expectedUpdatedAt: resolution.updatedAt,
        }
      );
      const missing = await registry.callTool(
        "publish_supplementary_resolution",
        {
          billId: bill.id,
          house: "HC",
          expectedUpdatedAt: resolution.updatedAt,
        }
      );

      expect(published).toEqual({ ok: false, reason: "already_published" });
      expect(missing).toEqual({ ok: false, reason: "not_found" });
    });

    it("公開するのは指定した院だけ", async () => {
      const bill = await createBill();
      const { resolution } = await upsert(bill.id, { isPublished: false });
      await upsert(bill.id, { house: "HC", isPublished: false });

      await registry.callTool("publish_supplementary_resolution", {
        billId: bill.id,
        house: "HR",
        expectedUpdatedAt: resolution.updatedAt,
      });

      expect(await getResolutions(bill.id)).toMatchObject([
        { house: "HR", isPublished: true },
        { house: "HC", isPublished: false },
      ]);
    });
  });

  it("4つのツールを登録する", () => {
    expect(registry.toolNames().sort()).toEqual([
      "delete_supplementary_resolution",
      "get_supplementary_resolution",
      "publish_supplementary_resolution",
      "upsert_supplementary_resolution",
    ]);
  });
});
