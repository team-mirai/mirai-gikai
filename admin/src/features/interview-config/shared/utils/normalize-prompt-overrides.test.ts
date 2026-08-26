import { getDefaultPromptSections } from "@mirai-gikai/shared/interview-prompts/default-sections";
import { describe, expect, it } from "vitest";
import { normalizePromptOverrides } from "./normalize-prompt-overrides";

const defaults = getDefaultPromptSections("loop");

describe("normalizePromptOverrides", () => {
  it("編集された節だけを残す", () => {
    expect(
      normalizePromptOverrides({ stopCriteria: "1往復で切り上げる" }, defaults)
    ).toEqual({ stopCriteria: "1往復で切り上げる" });
  });

  /*
    管理画面には「既定の文面を差し込む」ボタンがある。差し込んだまま保存すると
    既定値がDBに焼き付き、あとからコード側を改善してもその設定には届かない。
  */
  it("既定値と同じ文面は保存しない", () => {
    expect(
      normalizePromptOverrides(
        { stopCriteria: defaults.stopCriteria },
        defaults
      )
    ).toBeNull();
  });

  it("既定値と同じ節を落として、変更した節だけを残す", () => {
    const result = normalizePromptOverrides(
      { cautions: defaults.cautions, stopCriteria: "短く切り上げる" },
      defaults
    );

    expect(result).toEqual({ stopCriteria: "短く切り上げる" });
  });

  it("何も残らなければ null を返す", () => {
    expect(normalizePromptOverrides({}, defaults)).toBeNull();
    expect(normalizePromptOverrides(null, defaults)).toBeNull();
    expect(normalizePromptOverrides({ cautions: "  " }, defaults)).toBeNull();
  });

  it("知らないキーは落とす", () => {
    expect(
      normalizePromptOverrides({ unknownKey: "無視される" }, defaults)
    ).toBeNull();
  });
});
