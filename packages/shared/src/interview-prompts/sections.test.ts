import { describe, expect, it } from "vitest";
import { getDefaultPromptSections } from "./default-sections";
import { buildBulkModeSystemPrompt } from "./bulk-mode";
import { buildLoopModeSystemPrompt } from "./loop-mode";
import { buildTargetedModeSystemPrompt } from "./targeted-mode";
import {
  parsePromptSectionOverrides,
  PROMPT_SECTION_KEYS,
  PROMPT_SECTION_LABELS,
  PROMPT_SECTION_MAX_LENGTH,
  type PromptSections,
  resolvePromptSections,
} from "./sections";
import type { InterviewPromptInput } from "./types";

const defaults: PromptSections = {
  responsibilities: "既定の役割",
  cautions: "既定の注意事項",
  expertiseDetection: "既定の専門知識検出",
  deepDiveTechniques: "既定の深掘り",
  stopCriteria: "既定の打ち切り",
  questionUsageRules: "既定の活用ルール",
};

describe("parsePromptSectionOverrides", () => {
  it("知っているキーの文字列だけを残す", () => {
    expect(
      parsePromptSectionOverrides({
        cautions: "短く聞く",
        unknownKey: "無視される",
        stopCriteria: 42,
      })
    ).toEqual({ cautions: "短く聞く" });
  });

  // 入力欄を空にした状態は「消したい」ではなく「既定のまま」と読む。
  it("空文字と空白だけの値は落とす", () => {
    expect(
      parsePromptSectionOverrides({ cautions: "", stopCriteria: "  \n " })
    ).toEqual({});
  });

  it("オブジェクト以外は空として扱う", () => {
    expect(parsePromptSectionOverrides(null)).toEqual({});
    expect(parsePromptSectionOverrides(undefined)).toEqual({});
    expect(parsePromptSectionOverrides("文字列")).toEqual({});
    expect(parsePromptSectionOverrides(["配列"])).toEqual({});
  });
});

describe("resolvePromptSections", () => {
  it("上書きが無ければ既定値をそのまま返す", () => {
    expect(resolvePromptSections(defaults, null)).toEqual(defaults);
  });

  it("上書きした節だけを差し替える", () => {
    const resolved = resolvePromptSections(defaults, {
      stopCriteria: "1往復で切り上げる",
    });

    expect(resolved.stopCriteria).toBe("1往復で切り上げる");
    expect(resolved.cautions).toBe("既定の注意事項");
  });
});

describe("長すぎる上書き", () => {
  // 毎ターンのシステムプロンプトに載るため、DB を直接触られても効かせない。
  it("上限を超えた節は落として既定値に倒す", () => {
    const tooLong = "あ".repeat(PROMPT_SECTION_MAX_LENGTH + 1);

    expect(resolvePromptSections(defaults, { cautions: tooLong })).toEqual(
      defaults
    );
  });

  it("上限ちょうどは通す", () => {
    const justFit = "あ".repeat(PROMPT_SECTION_MAX_LENGTH);

    expect(resolvePromptSections(defaults, { cautions: justFit }).cautions).toBe(
      justFit
    );
  });
});

describe("PROMPT_SECTION_LABELS", () => {
  it("すべての節に名前と説明がある", () => {
    for (const key of PROMPT_SECTION_KEYS) {
      expect(PROMPT_SECTION_LABELS[key].label).not.toBe("");
      expect(PROMPT_SECTION_LABELS[key].description).not.toBe("");
    }
  });
});

describe("getDefaultPromptSections", () => {
  it("モードごとにすべての節がそろっている", () => {
    for (const mode of ["loop", "bulk", "targeted"] as const) {
      const sections = getDefaultPromptSections(mode);
      for (const key of PROMPT_SECTION_KEYS) {
        expect(sections[key]).toContain("## ");
      }
    }
  });
});

const promptInput: InterviewPromptInput = {
  bill: { name: "法案", bill_content: { title: "", summary: "", content: "" } },
  interviewConfig: { themes: [] },
  questions: [],
  currentStage: "chat",
  askedQuestionIds: new Set<string>(),
};

const BUILDERS = {
  loop: buildLoopModeSystemPrompt,
  bulk: buildBulkModeSystemPrompt,
  targeted: buildTargetedModeSystemPrompt,
} as const;

describe("3モードすべてで上書きが効く", () => {
  // どれか1つで resolvePromptSections を呼び忘れても気づけるようにする。
  it.each(["loop", "bulk", "targeted"] as const)("%s", (mode) => {
    const prompt = BUILDERS[mode]({
      ...promptInput,
      interviewConfig: {
        themes: [],
        prompt_overrides: { cautions: "## 注意事項\nとにかく短く聞く" },
      },
    });

    expect(prompt).toContain("とにかく短く聞く");
    expect(prompt).not.toContain(getDefaultPromptSections(mode).cautions);
  });
});

describe("組み上がったプロンプトへの反映", () => {
  it("上書きした文面がプロンプトに入り、既定の文面は消える", () => {
    const prompt = buildLoopModeSystemPrompt({
      ...promptInput,
      interviewConfig: {
        themes: [],
        prompt_overrides: { stopCriteria: "## 打ち切り\n1往復で切り上げる" },
      },
    });

    expect(prompt).toContain("1往復で切り上げる");
    expect(prompt).not.toContain("## 深掘りの打ち切り基準");
  });

  /*
    出力の約束事はコード側に固定している。ここが上書きで消せてしまうと、
    クイックリプライやトピックタイトルが出なくなる。
  */
  it("出力の指示は上書きできない", () => {
    const prompt = buildLoopModeSystemPrompt({
      ...promptInput,
      interviewConfig: {
        themes: [],
        prompt_overrides: {
          cautions: "## 注意事項\n自由に聞く",
        },
      },
    });

    expect(prompt).toContain("## クイックリプライについて");
    expect(prompt).toContain("## トピックタイトルについて");
  });
});
