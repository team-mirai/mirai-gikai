import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createTestDietSession,
  cleanupTestDietSession,
} from "@test-utils/utils";

// next/cache の unstable_cache をパススルーに（キャッシュなしで即実行）
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: never[]) => unknown) => fn,
}));

// モック登録後に動的インポート
const { getActiveDietSession } = await import("./get-active-diet-session");

describe("getActiveDietSession 統合テスト", () => {
  const sessionIds: string[] = [];

  afterEach(async () => {
    for (const id of sessionIds) {
      await cleanupTestDietSession(id);
    }
    sessionIds.length = 0;
  });

  it("アクティブな会期を返す", async () => {
    const session = await createTestDietSession({ is_active: true });
    sessionIds.push(session.id);

    const result = await getActiveDietSession();

    expect(result).not.toBeNull();
    expect(result?.is_active).toBe(true);
  });
});
