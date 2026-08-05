import { describe, expect, it } from "vitest";
import { normalizeReasoningTypes } from "./opinion-tags";

describe("normalizeReasoningTypes", () => {
  it("null / undefined を空配列にする", () => {
    expect(normalizeReasoningTypes(null)).toEqual([]);
    expect(normalizeReasoningTypes(undefined)).toEqual([]);
  });

  // プロトタイプでは enum を強制していなかったため "evidence" / "n" 等が混入していた。
  it("既知の値だけを残す", () => {
    expect(
      normalizeReasoningTypes(["professional_expertise", "evidence", "n", ""])
    ).toEqual(["professional_expertise"]);
  });

  it("null / undefined 要素を落とす", () => {
    expect(
      normalizeReasoningTypes(["intuition", null, undefined])
    ).toEqual(["intuition"]);
  });

  it("重複を除去する", () => {
    expect(normalizeReasoningTypes(["intuition", "intuition", "none"])).toEqual([
      "intuition",
      "none",
    ]);
  });

  it("順序を保持する", () => {
    expect(
      normalizeReasoningTypes(["none", "personal_experience", "intuition"])
    ).toEqual(["none", "personal_experience", "intuition"]);
  });
});
