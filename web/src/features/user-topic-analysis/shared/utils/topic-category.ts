import { normalizeRoleTitle } from "@mirai-gikai/topic-analysis-core/public";
import type { PublicOpinion, UserCategory } from "../types";

// 純粋ロジックの正準はパッケージ側。web 既存 import 互換のため再エクスポートする。
export { normalizeRoleTitle };

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
 * 引用の属性表示ラベル。固有の肩書があればそれを、無ければカテゴリラベルにフォールバックする。
 * 汎用的な「市民」相当の肩書もカテゴリラベル扱いにする。
 */
export function opinionAttributionLabel(opinion: PublicOpinion): string {
  return (
    normalizeRoleTitle(opinion.role_title) ??
    userCategoryLabels[opinion.user_category]
  );
}
