import { getDefaultPromptSections } from "@mirai-gikai/shared/interview-prompts/default-sections";
import { describe, expect, it } from "vitest";
import { normalizePromptOverrides } from "./normalize-prompt-overrides";

const defaults = getDefaultPromptSections("loop");

function normalize(input: unknown, stored?: unknown) {
  return normalizePromptOverrides({
    input,
    mode: "loop",
    defaults,
    stored,
  });
}

describe("normalizePromptOverrides", () => {
  it("編集された節を、そのモードの下に入れる", () => {
    expect(normalize({ stopCriteria: "1往復で切り上げる" })).toEqual({
      loop: { stopCriteria: "1往復で切り上げる" },
    });
  });

  /*
    管理画面には「既定の文面を差し込む」ボタンがある。差し込んだまま保存すると
    既定値がDBに焼き付き、あとからコード側を改善してもその設定には届かない。
  */
  it("既定値と同じ文面は保存しない", () => {
    expect(normalize({ stopCriteria: defaults.stopCriteria })).toBeNull();
  });

  it("既定値と同じ節を落として、変更した節だけを残す", () => {
    expect(
      normalize({ cautions: defaults.cautions, stopCriteria: "短く切り上げる" })
    ).toEqual({ loop: { stopCriteria: "短く切り上げる" } });
  });

  it("何も残らなければ null を返す", () => {
    expect(normalize({})).toBeNull();
    expect(normalize(null)).toBeNull();
    expect(normalize({ cautions: "  " })).toBeNull();
  });

  it("編集できない節は落とす", () => {
    expect(normalize({ responsibilities: "役割を変える" })).toBeNull();
  });

  // フォームは選択中のモードしか扱わないので、他モードの文面は触らずに残す。
  it("他のモードに保存済みの文面を残す", () => {
    const stored = { bulk: { cautions: "一括モード用の文面" } };

    expect(normalize({ stopCriteria: "短く" }, stored)).toEqual({
      bulk: { cautions: "一括モード用の文面" },
      loop: { stopCriteria: "短く" },
    });
  });

  it("編集を空にすると、そのモードの分だけ消える", () => {
    const stored = {
      bulk: { cautions: "一括モード用の文面" },
      loop: { stopCriteria: "以前の文面" },
    };

    expect(normalize({}, stored)).toEqual({
      bulk: { cautions: "一括モード用の文面" },
    });
  });
});
