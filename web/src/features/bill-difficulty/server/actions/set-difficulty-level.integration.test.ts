import { beforeEach, describe, expect, it, vi } from "vitest";
import { DIFFICULTY_COOKIE_OPTIONS } from "../../shared/types/index";
import {
  setDifficultyLevelCore,
  type CookieStore,
} from "../services/set-difficulty-level-core";

function createMockCookieStore() {
  const mockSet = vi.fn();
  const store: CookieStore = { set: mockSet };
  return { store, mockSet };
}

describe("setDifficultyLevel 統合テスト", () => {
  let mockSet: ReturnType<typeof vi.fn>;
  let deps: { getCookies: () => Promise<CookieStore> };

  beforeEach(() => {
    const mock = createMockCookieStore();
    mockSet = mock.mockSet;
    deps = { getCookies: async () => mock.store };
  });

  it("'normal' をCookieに保存する", async () => {
    await setDifficultyLevelCore("normal", deps);

    expect(mockSet).toHaveBeenCalledWith(
      "bill_difficulty_level",
      "normal",
      DIFFICULTY_COOKIE_OPTIONS
    );
  });

  it("'hard' をCookieに保存する", async () => {
    await setDifficultyLevelCore("hard", deps);

    expect(mockSet).toHaveBeenCalledWith(
      "bill_difficulty_level",
      "hard",
      DIFFICULTY_COOKIE_OPTIONS
    );
  });

  it("Cookie設定オプションにhttpOnly・path・maxAgeが含まれる", async () => {
    await setDifficultyLevelCore("normal", deps);

    const options = mockSet.mock.calls[0][2];
    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe("/");
    expect(options.maxAge).toBe(60 * 60 * 24 * 365);
    expect(options.sameSite).toBe("lax");
  });
});
