import { describe, expect, it } from "vitest";
import {
  isInvalidUserPublicSettingInput,
  parseUserPublicSetting,
} from "./public-setting";

describe("parseUserPublicSetting", () => {
  it.each([
    { input: true, expected: true },
    { input: false, expected: false },
    { input: "true", expected: undefined },
    { input: 1, expected: undefined },
    { input: null, expected: undefined },
    { input: undefined, expected: undefined },
  ])("boolean だけをユーザー公開設定として扱う ($input)", ({
    input,
    expected,
  }) => {
    expect(parseUserPublicSetting(input)).toBe(expected);
  });

  it.each([
    { input: undefined, expected: false },
    { input: true, expected: false },
    { input: false, expected: false },
    { input: "true", expected: true },
    { input: null, expected: true },
  ])("不正なユーザー公開設定入力を判定する ($input)", ({ input, expected }) => {
    expect(isInvalidUserPublicSettingInput(input)).toBe(expected);
  });
});
