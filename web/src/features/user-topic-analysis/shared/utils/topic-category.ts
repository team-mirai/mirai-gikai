import type { PublicOpinion, UserCategory } from "../types";

/** §9 の4区分の表示ラベル。 */
export const userCategoryLabels: Record<UserCategory, string> = {
  affected: "当事者",
  industry: "事業者",
  expert: "専門家",
  citizen: "市民",
};

/**
 * カテゴリ別アイコン色のテキストカラークラス。
 * globals.css の @theme で定義したトピック用トークンを参照する。
 */
export const userCategoryColorClass: Record<UserCategory, string> = {
  affected: "text-topic-affected",
  industry: "text-topic-industry",
  expert: "text-topic-expert",
  citizen: "text-topic-citizen",
};

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

/**
 * 引用の属性表示ラベル。固有の肩書があればそれを、無ければカテゴリラベルにフォールバックする。
 * 汎用的な「市民」相当の肩書もカテゴリラベル扱いにする。
 */
export function opinionAttributionLabel(opinion: PublicOpinion): string {
  return (
    normalizeRoleTitle(opinion.role_title) ??
    userCategoryLabels[opinion.user_category]
  );
}
