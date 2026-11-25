import { trimOrNull } from "@/lib/utils/normalize-string";
import type { SupplementaryResolutionInput } from "../types";

/**
 * フォーム・MCP の入力を bill_supplementary_resolutions のカラムに変換する。
 * 任意項目は前後の空白を除き、空なら null にする。
 */
export function toSupplementaryResolutionColumns(
  input: SupplementaryResolutionInput
) {
  return {
    house: input.house,
    reference_url: trimOrNull(input.referenceUrl),
    content: trimOrNull(input.content),
    stance: input.stance,
    focus_points: trimOrNull(input.focusPoints),
    reason: trimOrNull(input.reason),
    // 省略時は列ごと渡さない（upsert で既存の公開/非公開を保ち、新規は DB 既定の非公開になる）
    ...(input.isPublished !== undefined && {
      is_published: input.isPublished,
    }),
  };
}
