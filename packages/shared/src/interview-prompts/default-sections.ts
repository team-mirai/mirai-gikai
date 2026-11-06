import { BULK_MODE_DEFAULT_SECTIONS } from "./bulk-mode";
import { LOOP_MODE_DEFAULT_SECTIONS } from "./loop-mode";
import type { PromptSections } from "./sections";
import { TARGETED_MODE_DEFAULT_SECTIONS } from "./targeted-mode";
import type { InterviewMode } from "./types";

/**
 * モードごとの既定の節。
 *
 * 管理画面で「既定の文面を差し込む」ときと、編集値が未設定のときの土台に使う。
 * 実体は各モードのファイルが持ち、ここは引き当てるだけ。
 */
export const DEFAULT_PROMPT_SECTIONS_BY_MODE: Record<
  InterviewMode,
  PromptSections
> = {
  loop: LOOP_MODE_DEFAULT_SECTIONS,
  bulk: BULK_MODE_DEFAULT_SECTIONS,
  targeted: TARGETED_MODE_DEFAULT_SECTIONS,
};

/** 管理画面と保存時の比較で使う、そのモードの既定値。 */
export function getDefaultPromptSections(mode: InterviewMode): PromptSections {
  return DEFAULT_PROMPT_SECTIONS_BY_MODE[mode];
}
