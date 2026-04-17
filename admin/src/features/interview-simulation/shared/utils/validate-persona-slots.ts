import { MAX_PERSONA_SLOTS } from "../constants";
import type { PersonaSlotInput } from "../types";

export type ValidatePersonaSlotsResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * 複数ペルソナシミュ実行前のスロット配列バリデーション。
 * - 0 件は拒否
 * - 上限超過を拒否
 * - report ソースの重複 reportId を拒否
 *   （bill ソースは stance/role ヒント違いで同じ内容でも別スロット扱い）
 */
export function validatePersonaSlots(
  slots: PersonaSlotInput[]
): ValidatePersonaSlotsResult {
  if (slots.length === 0) {
    return { ok: false, error: "ペルソナを 1 件以上選択してください" };
  }
  if (slots.length > MAX_PERSONA_SLOTS) {
    return {
      ok: false,
      error: `ペルソナは最大 ${MAX_PERSONA_SLOTS} 件までです（現在: ${slots.length} 件）`,
    };
  }

  const seenReportIds = new Set<string>();
  for (const slot of slots) {
    if (slot.kind !== "report") continue;
    if (seenReportIds.has(slot.reportId)) {
      return {
        ok: false,
        error: "同じレポートが複数のスロットに含まれています",
      };
    }
    seenReportIds.add(slot.reportId);
  }

  return { ok: true };
}
