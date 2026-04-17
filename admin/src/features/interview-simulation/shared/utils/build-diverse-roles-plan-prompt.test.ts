import { describe, expect, it } from "vitest";
import { buildDiverseRolesPlanPrompt } from "./build-diverse-roles-plan-prompt";

const baseBill = {
  name: "宇宙ビジネス促進法案",
  bill_content: {
    title: "民間宇宙射場の整備促進",
    summary: "民間事業者の射場運用を支援する",
    content: "詳細条文",
  },
};

const baseConfig = {
  themes: ["射場の安全性", "地域経済への影響"],
  knowledge_source: "業界団体ヒアリング",
};

describe("buildDiverseRolesPlanPrompt", () => {
  it("法案情報・テーマ・スロット件数を含む", () => {
    const out = buildDiverseRolesPlanPrompt({
      bill: baseBill,
      interviewConfig: baseConfig,
      slotsToPlan: [{}, {}, {}],
    });
    expect(out).toContain("宇宙ビジネス促進法案");
    expect(out).toContain("民間宇宙射場の整備促進");
    expect(out).toContain("民間事業者の射場運用を支援する");
    expect(out).toContain("射場の安全性");
    expect(out).toContain("地域経済への影響");
    expect(out).toContain("業界団体ヒアリング");
    expect(out).toContain("3 人の当事者");
    expect(out).toContain("3 件");
  });

  it("スロット行が件数分・順序通り出る", () => {
    const out = buildDiverseRolesPlanPrompt({
      bill: baseBill,
      interviewConfig: baseConfig,
      slotsToPlan: [{}, {}],
    });
    expect(out).toContain("- スロット 1:");
    expect(out).toContain("- スロット 2:");
    expect(out).not.toContain("- スロット 3:");
  });

  it("stanceHint 指定スロットは日本語ラベル付きで明示される", () => {
    const out = buildDiverseRolesPlanPrompt({
      bill: baseBill,
      interviewConfig: baseConfig,
      slotsToPlan: [{ stanceHint: "for" }, {}, { stanceHint: "against" }],
    });
    expect(out).toContain("- スロット 1: スタンス指定=賛成");
    expect(out).toContain("- スロット 2: スタンス指定なし");
    expect(out).toContain("- スロット 3: スタンス指定=反対");
  });

  it("preassignedRoleHints があれば重複回避セクションが入る", () => {
    const out = buildDiverseRolesPlanPrompt({
      bill: baseBill,
      interviewConfig: baseConfig,
      slotsToPlan: [{}],
      preassignedRoleHints: ["射場運用の民間事業者", "近隣自治体の住民"],
    });
    expect(out).toContain("既にユーザーが手動指定した役割");
    expect(out).toContain("- 射場運用の民間事業者");
    expect(out).toContain("- 近隣自治体の住民");
  });

  it("preassignedRoleHints が無い場合は重複回避セクションを出さない", () => {
    const out = buildDiverseRolesPlanPrompt({
      bill: baseBill,
      interviewConfig: baseConfig,
      slotsToPlan: [{}, {}],
    });
    expect(out).not.toContain("既にユーザーが手動指定した役割");
  });

  it("テーマ未設定時は明示する", () => {
    const out = buildDiverseRolesPlanPrompt({
      bill: baseBill,
      interviewConfig: { themes: [], knowledge_source: null },
      slotsToPlan: [{}, {}],
    });
    expect(out).toContain("（テーマ未設定）");
    expect(out).toContain("（知識ソース未設定）");
  });

  it("出力フォーマットの順序保持指示が含まれる", () => {
    const out = buildDiverseRolesPlanPrompt({
      bill: baseBill,
      interviewConfig: baseConfig,
      slotsToPlan: [{}, {}, {}],
    });
    expect(out).toContain("同じ件数（3 件）");
    expect(out).toContain("同じ順序");
  });

  it("「一般市民」を避ける指示が含まれる", () => {
    const out = buildDiverseRolesPlanPrompt({
      bill: baseBill,
      interviewConfig: baseConfig,
      slotsToPlan: [{}, {}],
    });
    expect(out).toContain("一般市民");
    expect(out).toContain("禁止");
  });
});
