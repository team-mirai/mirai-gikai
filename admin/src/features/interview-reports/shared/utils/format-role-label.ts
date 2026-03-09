/**
 * 役割ラベルとrole_titleを中黒(・)で結合して表示用文字列を生成
 * 例：「専門家・物流業者」
 */
export function formatRoleLabel(
  role: string | null | undefined,
  roleTitle: string | null | undefined,
  roleLabels: Record<string, string>
): string | null {
  const baseLabel = role ? roleLabels[role] || role : null;
  if (baseLabel && roleTitle) {
    return `${baseLabel}・${roleTitle}`;
  }
  return roleTitle || baseLabel;
}
