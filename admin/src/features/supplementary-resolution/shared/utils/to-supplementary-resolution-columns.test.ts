import { describe, expect, it } from "vitest";
import { toSupplementaryResolutionColumns } from "./to-supplementary-resolution-columns";

describe("toSupplementaryResolutionColumns", () => {
  it("入力をカラム名に変換する", () => {
    expect(
      toSupplementaryResolutionColumns({
        house: "HR",
        referenceUrl: "https://example.com/resolution",
        content: "政府は施行状況を検証し、必要な措置を講ずること。",
        stance: "for",
        focusPoints: "施行後の検証",
        reason: "必要な配慮が盛り込まれているため",
      })
    ).toEqual({
      house: "HR",
      reference_url: "https://example.com/resolution",
      content: "政府は施行状況を検証し、必要な措置を講ずること。",
      stance: "for",
      focus_points: "施行後の検証",
      reason: "必要な配慮が盛り込まれているため",
    });
  });

  it("任意項目が省略・null・空白のみなら null にする", () => {
    expect(
      toSupplementaryResolutionColumns({
        house: "HR",
        referenceUrl: "  ",
        content: "",
        stance: "against",
        focusPoints: "   ",
        reason: null,
      })
    ).toEqual({
      house: "HR",
      reference_url: null,
      content: null,
      stance: "against",
      focus_points: null,
      reason: null,
    });
  });

  it("任意項目の前後の空白を取り除く", () => {
    const columns = toSupplementaryResolutionColumns({
      house: "HC",
      referenceUrl: "https://example.com/resolution",
      content: "\n一、施行状況を検証すること。\n二、周知に努めること。\n",
      stance: "for",
      focusPoints: "\n施行後の検証\n",
      reason: " 理由 ",
    });
    // 内容の途中の改行は複数行の記述としてそのまま残す
    expect(columns.content).toBe(
      "一、施行状況を検証すること。\n二、周知に努めること。"
    );
    expect(columns.focus_points).toBe("施行後の検証");
    expect(columns.reason).toBe("理由");
  });
});
