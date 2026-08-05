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
    expect(
      normalizeReasoningTypes(["intuition", "intuition", "overseas_example"])
    ).toEqual(["intuition", "overseas_example"]);
  });

  // none は「根拠の明示なし」なので他の根拠と同居させない。
  it("他の根拠があれば none を落とす", () => {
    expect(
      normalizeReasoningTypes(["professional_expertise", "none"])
    ).toEqual(["professional_expertise"]);
  });

  it("none だけなら残す", () => {
    expect(normalizeReasoningTypes(["none"])).toEqual(["none"]);
    expect(normalizeReasoningTypes(["none", "none"])).toEqual(["none"]);
  });

  it("順序を保持する", () => {
    expect(
      normalizeReasoningTypes(["personal_experience", "intuition"])
    ).toEqual(["personal_experience", "intuition"]);
  });
});
