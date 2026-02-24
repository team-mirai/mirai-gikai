import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock はファイル先頭にホイストされるため vi.hoisted() で変数を宣言
const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: mockGet,
  }),
}));

import { getDifficultyLevel } from "./get-difficulty-level";

describe("getDifficultyLevel 統合テスト", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("Cookieが未設定の場合、デフォルト値 'normal' を返す", async () => {
    mockGet.mockReturnValue(undefined);

    const result = await getDifficultyLevel();

    expect(result).toBe("normal");
    expect(mockGet).toHaveBeenCalledWith("bill_difficulty_level");
  });

  it("Cookieが 'normal' の場合、'normal' を返す", async () => {
    mockGet.mockReturnValue({ value: "normal" });

    const result = await getDifficultyLevel();

    expect(result).toBe("normal");
  });

  it("Cookieが 'hard' の場合、'hard' を返す", async () => {
    mockGet.mockReturnValue({ value: "hard" });

    const result = await getDifficultyLevel();

    expect(result).toBe("hard");
  });

  it("Cookieが無効な値の場合、デフォルト値 'normal' を返す", async () => {
    mockGet.mockReturnValue({ value: "invalid-value" });

    const result = await getDifficultyLevel();

    expect(result).toBe("normal");
  });

  it("Cookieが空文字の場合、デフォルト値 'normal' を返す", async () => {
    mockGet.mockReturnValue({ value: "" });

    const result = await getDifficultyLevel();

    expect(result).toBe("normal");
  });
});
