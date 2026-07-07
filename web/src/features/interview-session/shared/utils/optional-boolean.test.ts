import { describe, expect, it } from "vitest";
import {
  isInvalidOptionalBooleanInput,
  parseOptionalBoolean,
} from "./optional-boolean";

describe("parseOptionalBoolean", () => {
  it.each([
    { input: true, expected: true },
    { input: false, expected: false },
    { input: "true", expected: undefined },
    { input: 1, expected: undefined },
    { input: null, expected: undefined },
    { input: undefined, expected: undefined },
  ])("boolean だけを設定値として扱う ($input)", ({ input, expected }) => {
    expect(parseOptionalBoolean(input)).toBe(expected);
  });

  it.each([
    { input: undefined, expected: false },
    { input: true, expected: false },
    { input: false, expected: false },
    { input: "true", expected: true },
    { input: null, expected: true },
  ])("不正な入力を判定する ($input)", ({ input, expected }) => {
    expect(isInvalidOptionalBooleanInput(input)).toBe(expected);
  });
});
