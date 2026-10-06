import {
  cleanupTestBill,
  cleanupTestDietSession,
  createTestBill,
  createTestBillContent,
  createTestDietSession,
} from "@test-utils/utils";
import { afterEach, describe, expect, it, vi } from "vitest";

// unstable_cache はモジュール初期化時に評価されるため、
// テストファイル内で vi.mock → 動的インポートの順序を保証する。
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: never[]) => unknown) => fn,
}));
const { getPastSessionsWithBillCount } = await import(
  "./get-past-sessions-with-bill-count"
);

/**
 * 難易度は cookie 由来だが、統合テストではリクエストスコープ外のため
 * 既定値（normal）になる。テストデータもその難易度で作る。
 */
describe("getPastSessionsWithBillCount 統合テスト", () => {
  const sessionIds: string[] = [];
  const billIds: string[] = [];

  afterEach(async () => {
    for (const id of billIds) {
      await cleanupTestBill(id);
    }
    billIds.length = 0;
    for (const id of sessionIds) {
      await cleanupTestDietSession(id);
    }
    sessionIds.length = 0;
  });

  async function createPublishedBill(dietSessionId: string) {
    const bill = await createTestBill({
      publish_status: "published",
      diet_session_id: dietSessionId,
    });
    billIds.push(bill.id);
    await createTestBillContent(bill.id, { difficulty_level: "normal" });
  }

  it("アクティブな会期より前の会期を公開議案数つきで新しい順に返し、0件の会期は除く", async () => {
    const active = await createTestDietSession({
      start_date: "2031-01-01",
      end_date: "2031-06-30",
      is_active: true,
    });
    const older = await createTestDietSession({
      start_date: "2030-01-01",
      end_date: "2030-03-31",
    });
    const newer = await createTestDietSession({
      start_date: "2030-08-01",
      end_date: "2030-08-05",
    });
    const empty = await createTestDietSession({
      start_date: "2030-05-01",
      end_date: "2030-05-31",
    });
    sessionIds.push(active.id, older.id, newer.id, empty.id);
    await createPublishedBill(older.id);
    await createPublishedBill(newer.id);
    await createPublishedBill(newer.id);

    const result = await getPastSessionsWithBillCount();
    const ids = result.map(({ session }) => session.id);

    expect(ids).not.toContain(active.id);
    expect(ids).not.toContain(empty.id);
    expect(
      result.find(({ session }) => session.id === newer.id)?.billCount
    ).toBe(2);
    expect(
      result.find(({ session }) => session.id === older.id)?.billCount
    ).toBe(1);
    expect(ids.indexOf(newer.id)).toBeLessThan(ids.indexOf(older.id));
  });
});
