import { getDefaultPromptSections } from "@mirai-gikai/shared/interview-prompts/default-sections";
import {
  EDITABLE_PROMPT_SECTION_KEYS,
  parsePromptOverridesByMode,
  type PromptOverridesByMode,
  type PromptSectionOverrides,
} from "@mirai-gikai/shared/interview-prompts/sections";
import type { InterviewMode } from "@mirai-gikai/shared/interview-prompts/types";

/**
 * 保存する上書きを組み立てる。
 *
 * フォームは全モードぶんを持つので、渡された内容がそのまま保存対象になる。
 * 既定値と同じ文面は保存しない。管理画面には「既定の文面を差し込む」ボタンが
 * あり、差し込んだまま保存すると既定値がDBに焼き付いて、あとからコード側の
 * プロンプトを直してもその設定には届かなくなる。
 *
 * 何も残らなければ null を返し、列ごと空にする。
 */
export function normalizePromptOverrides(
  input: unknown
): PromptOverridesByMode | null {
  const parsed = parsePromptOverridesByMode(input);

  const result: PromptOverridesByMode = {};
  for (const [mode, sections] of Object.entries(parsed)) {
    const edited = pickEditedSections(sections, mode as InterviewMode);
    if (Object.keys(edited).length > 0) result[mode as InterviewMode] = edited;
  }

  return Object.keys(result).length > 0 ? result : null;
}

/** 既定値と違う節だけを取り出す。 */
function pickEditedSections(
  sections: PromptSectionOverrides,
  mode: InterviewMode
): PromptSectionOverrides {
  const defaults = getDefaultPromptSections(mode);

  const edited: PromptSectionOverrides = {};
  for (const key of EDITABLE_PROMPT_SECTION_KEYS) {
    const value = sections[key];
    if (value === undefined) continue;
    if (value === defaults[key]) continue;
    edited[key] = value;
  }
  return edited;
}
