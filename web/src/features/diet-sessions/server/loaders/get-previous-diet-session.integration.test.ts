import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createTestDietSession,
  cleanupTestDietSession,
} from "@test-utils/utils";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: never[]) => unknown) => fn,
}));

const { getPreviousDietSession } = await import("./get-previous-diet-session");

describe("getPreviousDietSession 統合テスト", () => {
  const sessionIds: string[] = [];

  afterEach(async () => {
    for (const id of sessionIds) {
      await cleanupTestDietSession(id);
    }
    sessionIds.length = 0;
  });

  it("アクティブな会期の前の会期を返す", async () => {
    // 古い会期を作成
    const older = await createTestDietSession({
      start_date: "2027-01-01",
      end_date: "2027-06-30",
      is_active: false,
    });
    sessionIds.push(older.id);

    // アクティブな会期を作成
    const active = await createTestDietSession({
      start_date: "2028-01-01",
      end_date: "2028-06-30",
      is_active: true,
    });
    sessionIds.push(active.id);

    const result = await getPreviousDietSession();

    expect(result).not.toBeNull();
    // biome-ignore lint/style/noNonNullAssertion: toBeNull 後に安全
    expect(new Date(result!.start_date) < new Date(active.start_date)).toBe(
      true
    );
  });
});
