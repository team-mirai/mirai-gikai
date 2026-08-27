import { EDITABLE_PROMPT_SECTION_KEYS } from "@mirai-gikai/shared/interview-prompts/sections";
import { INTERVIEW_MODES } from "@mirai-gikai/shared/interview-prompts/types";
import { describe, expect, it } from "vitest";
import { PROMPT_SECTION_MAX_LENGTH, promptOverridesSchema } from "./index";

describe("promptOverridesSchema", () => {
  /*
    節を増やしたときにスキーマ側の追加を忘れると、入力欄は出るのに保存で
    黙って落ちる。キーの一致をここで固定する。
  */
  it("モードを網羅している", () => {
    expect(Object.keys(promptOverridesSchema.shape).sort()).toEqual(
      [...INTERVIEW_MODES].sort()
    );
  });

  it("検証するキーが編集可能な節と一致する", () => {
    expect(
      Object.keys(promptOverridesSchema.shape.loop.unwrap().shape).sort()
    ).toEqual([...EDITABLE_PROMPT_SECTION_KEYS].sort());
  });

  it("一部の節だけの入力を受け付ける", () => {
    const result = promptOverridesSchema.safeParse({
      loop: { stopCriteria: "1往復で切り上げる" },
    });

    expect(result.success).toBe(true);
  });

  it("空の入力を受け付ける", () => {
    expect(promptOverridesSchema.safeParse({}).success).toBe(true);
  });

  it("長すぎる節を弾く", () => {
    const result = promptOverridesSchema.safeParse({
      loop: { cautions: "あ".repeat(PROMPT_SECTION_MAX_LENGTH + 1) },
    });

    expect(result.success).toBe(false);
  });
});
