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
 * 引用の属性表示ラベル。role_title があればそれを、無ければカテゴリラベルにフォールバックする。
 * role_title が空文字のケースも「無し」として扱う（"（）" 表示を防ぐ）。
 */
export function opinionAttributionLabel(opinion: PublicOpinion): string {
  return opinion.role_title?.trim()
    ? opinion.role_title
    : userCategoryLabels[opinion.user_category];
}
