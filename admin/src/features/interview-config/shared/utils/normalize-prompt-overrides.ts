import {
  EDITABLE_PROMPT_SECTION_KEYS,
  parsePromptOverridesByMode,
  type PromptOverridesByMode,
  type PromptSectionOverrides,
  type PromptSections,
} from "@mirai-gikai/shared/interview-prompts/sections";
import type { InterviewMode } from "@mirai-gikai/shared/interview-prompts/types";

/**
 * 保存する上書きを組み立てる。
 *
 * フォームは選択中のモードぶんしか扱わないので、他のモードに保存済みの文面は
 * そのまま残す。既定値と同じ文面は保存しない。管理画面には「既定の文面を
 * 差し込む」ボタンがあり、差し込んだまま保存すると既定値がDBに焼き付いて、
 * あとからコード側のプロンプトを直してもその設定には届かなくなる。
 *
 * 何も残らなければ null を返し、列ごと空にする。
 */
export function normalizePromptOverrides(params: {
  /** フォームが持っている、選択中モードぶんの入力 */
  input: unknown;
  /** 選択中のモード */
  mode: InterviewMode;
  /** そのモードの既定の節 */
  defaults: PromptSections;
  /** 保存済みの全モードぶん。他モードの文面を残すために使う */
  stored?: unknown;
}): PromptOverridesByMode | null {
  const { input, mode, defaults, stored } = params;

  const next: PromptOverridesByMode = { ...parsePromptOverridesByMode(stored) };
  const current = pickEditedSections(input, mode, defaults);

  if (Object.keys(current).length > 0) {
    next[mode] = current;
  } else {
    delete next[mode];
  }

  return Object.keys(next).length > 0 ? next : null;
}

/** 選択中モードの入力から、既定値と違う節だけを取り出す。 */
function pickEditedSections(
  input: unknown,
  mode: InterviewMode,
  defaults: PromptSections
): PromptSectionOverrides {
  // フォームは1モードぶんの形で持つので、モードで包んでから共通の検証にかける。
  const parsed = parsePromptOverridesByMode({ [mode]: input })[mode] ?? {};

  const edited: PromptSectionOverrides = {};
  for (const key of EDITABLE_PROMPT_SECTION_KEYS) {
    const value = parsed[key];
    if (value === undefined) continue;
    if (value === defaults[key]) continue;
    edited[key] = value;
  }
  return edited;
}
