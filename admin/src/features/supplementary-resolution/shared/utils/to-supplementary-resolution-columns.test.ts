import { describe, expect, it } from "vitest";
import { toSupplementaryResolutionColumns } from "./to-supplementary-resolution-columns";

describe("toSupplementaryResolutionColumns", () => {
  it("入力をカラム名に変換する", () => {
    expect(
      toSupplementaryResolutionColumns({
        referenceUrl: "https://example.com/resolution",
        stance: "for",
        focusPoints: "施行後の検証",
        reason: "必要な配慮が盛り込まれているため",
      })
    ).toEqual({
      reference_url: "https://example.com/resolution",
      stance: "for",
      focus_points: "施行後の検証",
      reason: "必要な配慮が盛り込まれているため",
    });
  });

  it("任意項目が省略・null・空白のみなら null にする", () => {
    expect(
      toSupplementaryResolutionColumns({
        referenceUrl: "https://example.com/resolution",
        stance: "against",
        focusPoints: "   ",
        reason: null,
      })
    ).toEqual({
      reference_url: "https://example.com/resolution",
      stance: "against",
      focus_points: null,
      reason: null,
    });
  });

  it("任意項目の前後の空白を取り除く", () => {
    const columns = toSupplementaryResolutionColumns({
      referenceUrl: "https://example.com/resolution",
      stance: "for",
      focusPoints: "\n施行後の検証\n",
      reason: " 理由 ",
    });
    expect(columns.focus_points).toBe("施行後の検証");
    expect(columns.reason).toBe("理由");
  });
});
