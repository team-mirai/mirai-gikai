/**
 * 「市民」相当の汎用的な肩書。固有の肩書とは見なさず、カテゴリラベルに委ねる。
 * （role_title データに「一般市民」等が入っていても UI 上は「市民」に統一するため。）
 */
const GENERIC_CITIZEN_TITLES = new Set(["一般市民", "市民", "一般"]);

/**
 * 表示用の肩書を返す。固有の肩書のみを返し、空文字や汎用的な「市民」相当は null。
 * 呼び出し側はこれが null のときカテゴリラベルにフォールバックする。
 */
export function normalizeRoleTitle(roleTitle: string | null): string | null {
  const trimmed = roleTitle?.trim();
  if (!trimmed || GENERIC_CITIZEN_TITLES.has(trimmed)) return null;
  return trimmed;
}
