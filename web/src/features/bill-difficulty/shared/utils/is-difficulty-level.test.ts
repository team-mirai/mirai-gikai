import { describe, expect, it } from "vitest";
import { isDifficultyLevel } from "./is-difficulty-level";

describe("isDifficultyLevel", () => {
  it("有効な難易度レベルならtrueを返す", () => {
    expect(isDifficultyLevel("normal")).toBe(true);
    expect(isDifficultyLevel("hard")).toBe(true);
  });

  it("無効な値はfalseを返す", () => {
    expect(isDifficultyLevel("expert")).toBe(false);
    expect(isDifficultyLevel("")).toBe(false);
    expect(isDifficultyLevel(null)).toBe(false);
    expect(isDifficultyLevel(undefined)).toBe(false);
  });
});
