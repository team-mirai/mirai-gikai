import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createTestDietSession,
  cleanupTestDietSession,
} from "@test-utils/utils";

// unstable_cache はモジュール初期化時に評価されるため、
// setup の共通モック（vitest.integration.setup.ts）だけでは不十分。
// テストファイル内で vi.mock → 動的インポートの順序を保証する必要がある。
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: never[]) => unknown) => fn,
}));

const { getCurrentDietSession } = await import("./get-current-diet-session");

describe("getCurrentDietSession 統合テスト", () => {
  let sessionIds: string[] = [];

  afterEach(async () => {
    for (const id of sessionIds) {
      await cleanupTestDietSession(id);
    }
    sessionIds = [];
  });

  it("Date オブジェクトを渡して該当期間の会期を返す", async () => {
    const session = await createTestDietSession({
      start_date: "2025-05-01",
      end_date: "2025-10-31",
      is_active: false,
    });
    sessionIds.push(session.id);

    // Date オブジェクトを渡す（loader固有の変換ロジック）
    const result = await getCurrentDietSession(new Date("2025-07-15"));

    expect(result).not.toBeNull();
    expect(result?.id).toBe(session.id);
  });

  it("範囲外の Date では該当会期を返さない", async () => {
    const session = await createTestDietSession({
      start_date: "2031-01-01",
      end_date: "2031-06-30",
      is_active: false,
    });
    sessionIds.push(session.id);

    const result = await getCurrentDietSession(new Date("2031-07-01"));

    if (result) {
      expect(result.id).not.toBe(session.id);
    }
  });
});
