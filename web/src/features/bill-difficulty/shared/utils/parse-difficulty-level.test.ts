import { describe, it, expect } from "vitest";
import { parseDifficultyLevel } from "./parse-difficulty-level";

describe("parseDifficultyLevel", () => {
  it("'normal' を返す（有効値）", () => {
    expect(parseDifficultyLevel("normal")).toBe("normal");
  });

  it("'hard' を返す（有効値）", () => {
    expect(parseDifficultyLevel("hard")).toBe("hard");
  });

  it("undefined の場合、デフォルト値 'normal' を返す", () => {
    expect(parseDifficultyLevel(undefined)).toBe("normal");
  });

  it("空文字の場合、デフォルト値 'normal' を返す", () => {
    expect(parseDifficultyLevel("")).toBe("normal");
  });

  it("無効な値の場合、デフォルト値 'normal' を返す", () => {
    expect(parseDifficultyLevel("invalid-value")).toBe("normal");
  });

  it("大文字小文字が異なる場合、デフォルト値 'normal' を返す", () => {
    expect(parseDifficultyLevel("Normal")).toBe("normal");
    expect(parseDifficultyLevel("HARD")).toBe("normal");
  });
});
