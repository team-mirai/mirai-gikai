import { describe, expect, it } from "vitest";
import type { MiraiStance } from "../types";
import { getStanceStyles } from "./stance-styles";

function makeStance(
  type: MiraiStance["type"],
  overrides?: Partial<MiraiStance>
): MiraiStance {
  return {
    id: "1",
    bill_id: "bill-1",
    type,
    comment: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("getStanceStyles", () => {
  it("isPreparing=true のとき法案提出前スタイルを返す", () => {
    const result = getStanceStyles(undefined, true);
    expect(result).toEqual({
      bg: "bg-white",
      border: "border-[#8E8E93]",
      textColor: "text-[#8E8E93]",
      label: "法案提出前",
    });
  });

  it("isPreparing=true のときスタンスがあっても法案提出前スタイルを返す", () => {
    const result = getStanceStyles(makeStance("for"), true);
    expect(result.label).toBe("法案提出前");
  });

  it("for スタンスで賛成スタイルを返す", () => {
    const result = getStanceStyles(makeStance("for"), false);
    expect(result).toEqual({
      bg: "bg-[#ECFCF1]",
      textColor: "text-[#0F8472]",
      label: "賛成",
    });
  });

  it("conditional_for スタンスで条件付き賛成スタイルを返す", () => {
    const result = getStanceStyles(makeStance("conditional_for"), false);
    expect(result).toEqual({
      bg: "bg-[#ECFCF1]",
      textColor: "text-[#0F8472]",
      label: "条件付き賛成",
    });
  });

  it("against スタンスで反対スタイルを返す", () => {
    const result = getStanceStyles(makeStance("against"), false);
    expect(result).toEqual({
      bg: "bg-[#FFF1F1]",
      textColor: "text-[#C9272A]",
      label: "反対",
    });
  });

  it("conditional_against スタンスで条件付き反対スタイルを返す", () => {
    const result = getStanceStyles(makeStance("conditional_against"), false);
    expect(result).toEqual({
      bg: "bg-[#FFF1F1]",
      textColor: "text-[#C9272A]",
      label: "条件付き反対",
    });
  });

  it("neutral スタンスでデフォルトスタイルを返す", () => {
    const result = getStanceStyles(makeStance("neutral"), false);
    expect(result).toEqual({
      bg: "bg-[#E5E5EA]",
      textColor: "text-black",
      label: "中立",
    });
  });

  it("considering スタンスでデフォルトスタイルを返す", () => {
    const result = getStanceStyles(makeStance("considering"), false);
    expect(result).toEqual({
      bg: "bg-[#E5E5EA]",
      textColor: "text-black",
      label: "検討中",
    });
  });

  it("continued_deliberation スタンスでデフォルトスタイルを返す", () => {
    const result = getStanceStyles(makeStance("continued_deliberation"), false);
    expect(result).toEqual({
      bg: "bg-[#E5E5EA]",
      textColor: "text-black",
      label: "継続審査中",
    });
  });

  it("stance=undefined, isPreparing=false のとき中立ラベルを返す", () => {
    const result = getStanceStyles(undefined, false);
    expect(result).toEqual({
      bg: "bg-[#E5E5EA]",
      textColor: "text-black",
      label: "中立",
    });
  });
});
