import { describe, expect, it } from "vitest";
import { buildBulkModeSystemPrompt } from "./bulk-mode";
import { getDefaultPromptSections } from "./default-sections";
import { buildLoopModeSystemPrompt } from "./loop-mode";
import {
  EDITABLE_PROMPT_SECTION_KEYS,
  parsePromptOverridesByMode,
  parsePromptSectionOverrides,
  PROMPT_SECTION_LABELS,
  PROMPT_SECTION_MAX_LENGTH,
  type PromptSections,
  resolvePromptSections,
} from "./sections";
import { buildTargetedModeSystemPrompt } from "./targeted-mode";
import type { InterviewPromptInput } from "./types";

const defaults: PromptSections = {
  responsibilities: "既定の役割",
  cautions: "既定の注意事項",
  expertiseDetection: "既定の専門知識検出",
  deepDiveTechniques: "既定の深掘り",
  stopCriteria: "既定の打ち切り",
  questionUsageRules: "既定の活用ルール",
};

describe("parsePromptOverridesByMode", () => {
  it("知っているモードと節の文字列だけを残す", () => {
    expect(
      parsePromptOverridesByMode({
        loop: { cautions: "短く聞く", unknownKey: "無視される" },
        unknownMode: { cautions: "無視される" },
      })
    ).toEqual({ loop: { cautions: "短く聞く" } });
  });

  // 編集できない節は、DBに残っていても効かせない。
  it("編集可能でない節は落とす", () => {
    expect(
      parsePromptOverridesByMode({ loop: { responsibilities: "役割" } })
    ).toEqual({});
  });

  // 入力欄を空にした状態は「消したい」ではなく「既定のまま」と読む。
  it("空文字と空白だけの値は落とす", () => {
    expect(
      parsePromptOverridesByMode({
        loop: { cautions: "", stopCriteria: " \n" },
      })
    ).toEqual({});
  });

  it("オブジェクト以外は空として扱う", () => {
    expect(parsePromptOverridesByMode(null)).toEqual({});
    expect(parsePromptOverridesByMode("文字列")).toEqual({});
    expect(parsePromptOverridesByMode(["配列"])).toEqual({});
    expect(parsePromptOverridesByMode({ loop: "文字列" })).toEqual({});
  });

  // 毎ターンのシステムプロンプトに載るため、DBを直接触られても効かせない。
  it("上限を超えた節は落とし、ちょうどは通す", () => {
    const tooLong = "あ".repeat(PROMPT_SECTION_MAX_LENGTH + 1);
    const justFit = "あ".repeat(PROMPT_SECTION_MAX_LENGTH);

    expect(parsePromptOverridesByMode({ loop: { cautions: tooLong } })).toEqual(
      {}
    );
    expect(
      parsePromptOverridesByMode({ loop: { cautions: justFit } })
    ).toEqual({ loop: { cautions: justFit } });
  });
});

describe("parsePromptSectionOverrides", () => {
  it("指定したモードのぶんだけを取り出す", () => {
    const stored = {
      loop: { cautions: "ループ用" },
      bulk: { cautions: "一括用" },
    };

    expect(parsePromptSectionOverrides(stored, "bulk")).toEqual({
      cautions: "一括用",
    });
    expect(parsePromptSectionOverrides(stored, "targeted")).toEqual({});
  });
});

describe("resolvePromptSections", () => {
  it("上書きが無ければ既定値をそのまま返す", () => {
    expect(resolvePromptSections(defaults, null, "loop")).toEqual(defaults);
  });

  it("そのモードの上書きだけを差し替える", () => {
    const resolved = resolvePromptSections(
      defaults,
      { loop: { stopCriteria: "1往復で切り上げる" } },
      "loop"
    );

    expect(resolved.stopCriteria).toBe("1往復で切り上げる");
    expect(resolved.cautions).toBe("既定の注意事項");
  });

  // モードを跨いで文面が混ざると、正反対の指示が同じプロンプトに並ぶ。
  it("他のモード向けの上書きは効かせない", () => {
    expect(
      resolvePromptSections(defaults, { loop: { cautions: "ループ用" } }, "bulk")
    ).toEqual(defaults);
  });
});

describe("PROMPT_SECTION_LABELS", () => {
  it("編集できるすべての節に名前と説明がある", () => {
    for (const key of EDITABLE_PROMPT_SECTION_KEYS) {
      expect(PROMPT_SECTION_LABELS[key].label).not.toBe("");
      expect(PROMPT_SECTION_LABELS[key].description).not.toBe("");
    }
  });
});

describe("getDefaultPromptSections", () => {
  it("編集できる節の既定値がモードごとにそろっている", () => {
    for (const mode of ["loop", "bulk", "targeted"] as const) {
      const sections = getDefaultPromptSections(mode);
      for (const key of EDITABLE_PROMPT_SECTION_KEYS) {
        expect(sections[key]).toContain("## ");
      }
    }
  });
});

const promptInput: InterviewPromptInput = {
  bill: { name: "法案", bill_content: { title: "", summary: "", content: "" } },
  interviewConfig: { themes: [] },
  questions: [{ id: "q1", question: "質問" }],
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
        prompt_overrides: { [mode]: { cautions: "## 注意事項\nとにかく短く" } },
      },
    });

    expect(prompt).toContain("とにかく短く");
    expect(prompt).not.toContain(getDefaultPromptSections(mode).cautions);
  });
});

// 次の質問を指定する経路は短いプロンプトに切り替わるが、話し方は効かせる。
it("一括モードの次質問指定時も上書きが効く", () => {
  const prompt = buildBulkModeSystemPrompt({
    ...promptInput,
    nextQuestionId: "q1",
    interviewConfig: {
      themes: [],
      prompt_overrides: { bulk: { cautions: "## 注意事項\nとにかく短く" } },
    },
  });

  expect(prompt).toContain("とにかく短く");
});

describe("固定している部分", () => {
  /*
    出力の約束事はコード側に固定している。ここが上書きで消せてしまうと、
    クイックリプライやトピックタイトルが出なくなる。
  */
  it("出力の指示は上書きできない", () => {
    const prompt = buildLoopModeSystemPrompt({
      ...promptInput,
      interviewConfig: {
        themes: [],
        prompt_overrides: { loop: { cautions: "## 注意事項\n自由に聞く" } },
      },
    });

    expect(prompt).toContain("## クイックリプライについて");
    expect(prompt).toContain("## トピックタイトルについて");
  });

  /*
    対象者条件によるスキップとフォローアップ指針の優先は、対象者指定モードが
    成り立つための指示。消えても LLM は喋り続けるので気づけない。
  */
  it("対象者指定モードの必須ルールは上書きできない", () => {
    const prompt = buildTargetedModeSystemPrompt({
      ...promptInput,
      interviewConfig: {
        themes: [],
        prompt_overrides: {
          targeted: { cautions: "## 注意事項\n自由に聞く" },
        },
      },
    });

    expect(prompt).toContain("対象者条件に基づき");
    expect(prompt).toContain("フォローアップ指針は最優先で守る");
  });
});
