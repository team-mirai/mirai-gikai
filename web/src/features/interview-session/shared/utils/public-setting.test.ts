import { describe, expect, it } from "vitest";
import { parseUserPublicSetting } from "./public-setting";

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
});
