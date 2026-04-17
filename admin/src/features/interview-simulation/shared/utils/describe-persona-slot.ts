import type { CompletedReportListItem, PersonaSlotInput } from "../types";

const STANCE_LABEL: Record<"for" | "against" | "neutral", string> = {
  for: "賛成",
  against: "反対",
  neutral: "中立",
};

/**
 * PersonaSlotInput から UI 表示用ラベルを生成する純粋関数。
 *
 * - report ソース: 対応する CompletedReportListItem があれば
 *   「レポート: <roleTitle> / <stance>」、なければ reportId 断片
 * - bill ソース: 「自動生成: <stance>」 + role ヒント付与
 */
export function describePersonaSlot(
  slot: PersonaSlotInput,
  reportLookup?: ReadonlyMap<string, CompletedReportListItem>
): string {
  if (slot.kind === "report") {
    const report = reportLookup?.get(slot.reportId);
    if (!report) {
      return `レポート: ${slot.reportId.slice(0, 8)}…`;
    }
    const roleTitle = report.roleTitle ?? "立場不明";
    const stance = report.stance
      ? (STANCE_LABEL[report.stance as "for" | "against" | "neutral"] ??
        report.stance)
      : "中立";
    return `レポート: ${roleTitle} / ${stance}`;
  }
  const stance = slot.stanceHint ? STANCE_LABEL[slot.stanceHint] : "自動判定";
  const role = slot.roleHint?.trim();
  return role ? `自動生成: ${stance} / ${role}` : `自動生成: ${stance}`;
}
