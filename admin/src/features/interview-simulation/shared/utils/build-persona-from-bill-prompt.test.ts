import { describe, expect, it } from "vitest";
import { buildPersonaFromBillPrompt } from "./build-persona-from-bill-prompt";

const baseBill = {
  name: "宇宙活動法改正案",
  knowledge_source: "宇宙活動法の概要",
  bill_content: {
    title: "人工衛星等の打上げ及び人工衛星の管理に関する法律案",
    summary: "ロケットの打上げルールを見直す法律",
    content: "第一条 本法律は…",
  },
};

const baseConfig = {
  themes: ["安全確保", "産業競争力"],
};

describe("buildPersonaFromBillPrompt", () => {
  it("法案情報・テーマ・知識ソースがプロンプトに含まれる", () => {
    const result = buildPersonaFromBillPrompt({
      bill: baseBill,
      interviewConfig: baseConfig,
    });
    expect(result).toContain("宇宙活動法改正案");
    expect(result).toContain(
      "人工衛星等の打上げ及び人工衛星の管理に関する法律案"
    );
    expect(result).toContain("第一条 本法律は…");
    expect(result).toContain("安全確保");
    expect(result).toContain("産業競争力");
    expect(result).toContain("宇宙活動法の概要");
  });

  it("stanceHint 指定時はスタンスを必須として明記する", () => {
    const result = buildPersonaFromBillPrompt({
      bill: baseBill,
      interviewConfig: baseConfig,
      stanceHint: "against",
    });
    expect(result).toContain("反対");
    expect(result).toContain('"against"');
    expect(result).toContain("必須");
  });

  it("stanceHint 未指定時は LLM に決めさせる文言になる", () => {
    const result = buildPersonaFromBillPrompt({
      bill: baseBill,
      interviewConfig: baseConfig,
    });
    expect(result).toContain("自然に導かれる立場");
    expect(result).not.toContain("（必須）");
  });

  it("roleHint 指定時は役割ヒントをプロンプトに含める", () => {
    const result = buildPersonaFromBillPrompt({
      bill: baseBill,
      interviewConfig: baseConfig,
      roleHint: "射場運用の民間事業者",
    });
    expect(result).toContain("射場運用の民間事業者");
  });

  it("テーマ未設定でも壊れない", () => {
    const result = buildPersonaFromBillPrompt({
      bill: { ...baseBill, knowledge_source: "" },
      interviewConfig: { themes: [] },
    });
    expect(result).toContain("テーマ未設定");
    expect(result).toContain("知識ソース未設定");
  });

  it("roleHint 未指定時は抽象キャラを避ける注意書きが含まれる", () => {
    const result = buildPersonaFromBillPrompt({
      bill: baseBill,
      interviewConfig: baseConfig,
    });
    expect(result).toContain("抽象");
    expect(result).toContain("具体的");
  });

  it("roleHint 指定時はヒントを最優先させる（「一般市民」でも置き換え禁止）", () => {
    const result = buildPersonaFromBillPrompt({
      bill: baseBill,
      interviewConfig: baseConfig,
      roleHint: "一般市民",
    });
    expect(result).toContain("一般市民");
    expect(result).toContain("最優先");
    // 勝手に別の職種に置き換えないよう明記されていること
    expect(result).toMatch(/置き換え|勝手に/);
    // roleHint 指定時は「抽象キャラ禁止」の旧強い禁則が出ないこと
    expect(result).not.toMatch(/抽象キャラは禁止/);
  });
});
