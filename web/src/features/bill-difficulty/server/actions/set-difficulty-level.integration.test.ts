import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock はファイル先頭にホイストされるため vi.hoisted() で変数を宣言
const { mockSet } = vi.hoisted(() => ({
  mockSet: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    set: mockSet,
  }),
}));

import { DIFFICULTY_COOKIE_OPTIONS } from "../../shared/types";
import { setDifficultyLevel } from "./set-difficulty-level";

describe("setDifficultyLevel 統合テスト", () => {
  beforeEach(() => {
    mockSet.mockReset();
  });

  it("'normal' をCookieに保存する", async () => {
    await setDifficultyLevel("normal");

    expect(mockSet).toHaveBeenCalledWith(
      "bill_difficulty_level",
      "normal",
      DIFFICULTY_COOKIE_OPTIONS
    );
  });

  it("'hard' をCookieに保存する", async () => {
    await setDifficultyLevel("hard");

    expect(mockSet).toHaveBeenCalledWith(
      "bill_difficulty_level",
      "hard",
      DIFFICULTY_COOKIE_OPTIONS
    );
  });

  it("Cookie設定オプションにhttpOnly・path・maxAgeが含まれる", async () => {
    await setDifficultyLevel("normal");

    const options = mockSet.mock.calls[0][2];
    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe("/");
    expect(options.maxAge).toBe(60 * 60 * 24 * 365);
    expect(options.sameSite).toBe("lax");
  });
});
