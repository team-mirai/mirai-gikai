import {
  parsePromptSectionOverrides,
  type PromptSectionOverrides,
  PROMPT_SECTION_KEYS,
  type PromptSections,
} from "@mirai-gikai/shared/interview-prompts/sections";

/**
 * 保存する上書きだけを残す。
 *
 * 既定値と同じ文面は保存しない。管理画面には「既定の文面を差し込む」ボタンが
 * あり、差し込んだまま保存すると既定値がDBに焼き付く。そうなると後から
 * コード側のプロンプトを直しても、その設定には届かなくなる。
 *
 * 何も残らなければ null を返し、列ごと空にする。
 */
export function normalizePromptOverrides(
  input: unknown,
  defaults: PromptSections
): PromptSectionOverrides | null {
  const parsed = parsePromptSectionOverrides(input);

  const overrides: PromptSectionOverrides = {};
  for (const key of PROMPT_SECTION_KEYS) {
    const value = parsed[key];
    if (value === undefined) continue;
    if (value === defaults[key]) continue;
    overrides[key] = value;
  }

  return Object.keys(overrides).length > 0 ? overrides : null;
}
