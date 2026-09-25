import {
  adminClient,
  cleanupTestBill,
  cleanupTestTag,
  createTestBill,
  createTestBillContent,
  createTestBillTag,
  createTestTag,
} from "@test-utils/utils";
import { afterEach, describe, expect, it, vi } from "vitest";

// unstable_cache はモジュール初期化時に評価されるため、
// setup の共通モック（vitest.integration.setup.ts）だけでは不十分。
// テストファイル内で vi.mock → 動的インポートの順序を保証する必要がある。
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: never[]) => unknown) => fn,
}));
const { getInterviewOpenBills } = await import("./get-interview-open-bills");

/**
 * 難易度は cookie 由来だが、統合テストではリクエストスコープ外のため
 * 既定値（normal）になる。テストデータもその難易度で作る。
 */
describe("getInterviewOpenBills 統合テスト", () => {
  const billIds: string[] = [];
  const tagIds: string[] = [];

  afterEach(async () => {
    for (const id of billIds) {
      await cleanupTestBill(id);
    }
    billIds.length = 0;
    for (const id of tagIds) {
      await cleanupTestTag(id);
    }
    tagIds.length = 0;
  });

  async function createInterviewOpenBill(
    billOverrides: Parameters<typeof createTestBill>[0] = {},
    contentOverrides: Parameters<typeof createTestBillContent>[1] = {}
  ) {
    const bill = await createTestBill({
      publish_status: "published",
      ...billOverrides,
    });
    billIds.push(bill.id);
    await createTestBillContent(bill.id, {
      difficulty_level: "normal",
      ...contentOverrides,
    });
    const { error } = await adminClient.from("interview_configs").insert({
      bill_id: bill.id,
      status: "public",
      name: `テスト設定 ${Date.now()}-${Math.random()}`,
    });
    if (error) {
      throw new Error(`interview_config 作成失敗: ${error.message}`);
    }
    return bill;
  }

  it("受付中の議案を難易度コンテンツ付きで返す", async () => {
    const bill = await createInterviewOpenBill(
      {},
      { title: "受付中の議案", summary: "受付中の議案の要約" }
    );

    const result = await getInterviewOpenBills();

    const found = result.find((b) => b.id === bill.id);
    expect(found).toBeDefined();
    expect(found?.bill_content?.title).toBe("受付中の議案");
    expect(found?.bill_content?.summary).toBe("受付中の議案の要約");
  });

  // クエリの絞り込み条件そのものなので、返る議案は全件が受付中になる。
  it("返した議案には受付中の印が付く", async () => {
    const bill = await createInterviewOpenBill();

    const result = await getInterviewOpenBills();

    expect(result.find((b) => b.id === bill.id)?.hasPublicInterview).toBe(true);
    expect(result.every((b) => b.hasPublicInterview)).toBe(true);
  });

  it("タグを平坦化して返す", async () => {
    const tag = await createTestTag();
    tagIds.push(tag.id);
    const bill = await createInterviewOpenBill();
    await createTestBillTag(bill.id, tag.id);

    const result = await getInterviewOpenBills();

    expect(result.find((b) => b.id === bill.id)?.tags).toEqual([
      { id: tag.id, label: tag.label },
    ]);
  });

  it("タグが無い議案は空配列になる", async () => {
    const bill = await createInterviewOpenBill();

    const result = await getInterviewOpenBills();

    expect(result.find((b) => b.id === bill.id)?.tags).toEqual([]);
  });

  // join の後始末。付いたまま返すと BillWithContent に無いキーが混ざる。
  it("interview_configs はレスポンスに含めない", async () => {
    const bill = await createInterviewOpenBill();

    const result = await getInterviewOpenBills();

    const found = result.find((b) => b.id === bill.id);
    expect(found).not.toHaveProperty("interview_configs");
    expect(found).not.toHaveProperty("bill_contents");
    expect(found).not.toHaveProperty("bills_tags");
  });

  it("受付中でない議案は含まれない", async () => {
    const bill = await createTestBill({ publish_status: "published" });
    billIds.push(bill.id);
    await createTestBillContent(bill.id, { difficulty_level: "normal" });

    const result = await getInterviewOpenBills();

    expect(result.find((b) => b.id === bill.id)).toBeUndefined();
  });
});
