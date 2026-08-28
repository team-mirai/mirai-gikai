import { getDefaultPromptSections } from "@mirai-gikai/shared/interview-prompts/default-sections";
import { describe, expect, it } from "vitest";
import { normalizePromptOverrides } from "./normalize-prompt-overrides";

const loopDefaults = getDefaultPromptSections("loop");

describe("normalizePromptOverrides", () => {
  it("編集された節を、そのモードの下に残す", () => {
    expect(
      normalizePromptOverrides({ loop: { stopCriteria: "1往復で切り上げる" } })
    ).toEqual({ loop: { stopCriteria: "1往復で切り上げる" } });
  });

  /*
    管理画面には「既定の文面を差し込む」ボタンがある。差し込んだまま保存すると
    既定値がDBに焼き付き、あとからコード側を改善してもその設定には届かない。
  */
  it("既定値と同じ文面は保存しない", () => {
    expect(
      normalizePromptOverrides({
        loop: { stopCriteria: loopDefaults.stopCriteria },
      })
    ).toBeNull();
  });

  it("既定値と同じ節を落として、変更した節だけを残す", () => {
    expect(
      normalizePromptOverrides({
        loop: {
          cautions: loopDefaults.cautions,
          stopCriteria: "短く切り上げる",
        },
      })
    ).toEqual({ loop: { stopCriteria: "短く切り上げる" } });
  });

  /*
    比較はモードごとに行う。cautions は loop と bulk で文面が違うので、
    loop の既定値を bulk に入れれば「既定と違う」として保存される。
    stopCriteria は3モードで同一なので、この検証には使えない。
  */
  it("別モードの既定値とは比較しない", () => {
    expect(
      normalizePromptOverrides({ bulk: { cautions: loopDefaults.cautions } })
    ).toEqual({ bulk: { cautions: loopDefaults.cautions } });
  });

  it("複数モードぶんをまとめて保存する", () => {
    expect(
      normalizePromptOverrides({
        loop: { stopCriteria: "ループ用" },
        bulk: { cautions: "一括用" },
      })
    ).toEqual({
      loop: { stopCriteria: "ループ用" },
      bulk: { cautions: "一括用" },
    });
  });

  it("何も残らなければ null を返す", () => {
    expect(normalizePromptOverrides({})).toBeNull();
    expect(normalizePromptOverrides(null)).toBeNull();
    expect(normalizePromptOverrides({ loop: { cautions: "  " } })).toBeNull();
  });

  it("編集できない節と知らないモードは落とす", () => {
    expect(
      normalizePromptOverrides({
        loop: { responsibilities: "役割を変える" },
        unknownMode: { cautions: "無視される" },
      })
    ).toBeNull();
  });
});
