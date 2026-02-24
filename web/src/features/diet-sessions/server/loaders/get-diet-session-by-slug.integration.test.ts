import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createTestDietSession,
  cleanupTestDietSession,
} from "@test-utils/utils";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: never[]) => unknown) => fn,
}));

const { getDietSessionBySlug } = await import("./get-diet-session-by-slug");

describe("getDietSessionBySlug 統合テスト", () => {
  let sessionIds: string[] = [];

  afterEach(async () => {
    for (const id of sessionIds) {
      await cleanupTestDietSession(id);
    }
    sessionIds = [];
  });

  it("slug で会期を取得できる", async () => {
    const slug = `test-slug-loader-${Date.now()}`;
    const session = await createTestDietSession({ slug });
    sessionIds.push(session.id);

    const result = await getDietSessionBySlug(slug);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(session.id);
    expect(result?.slug).toBe(slug);
  });

  it("存在しない slug では null を返す", async () => {
    const result = await getDietSessionBySlug(
      "non-existent-slug-loader-999999999"
    );

    expect(result).toBeNull();
  });
});
