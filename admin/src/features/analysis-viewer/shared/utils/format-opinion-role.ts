import { roleLabels } from "@/features/interview-reports/shared/constants";

/**
 * 立場の表示。レポート画面と同じ日本語ラベルに寄せる。
 *
 * roleTitle だけだと「一般市民」のような無情報な文字列が並ぶので、
 * role の区分と組み合わせて引用の妥当性を判断できるようにする。
 *
 * カード表示とコピー本文の両方で使う。片方だけ表記が変わると、貼り付けた
 * 質問案と画面の見え方がずれる。
 */
export function formatOpinionRole(
  role: string | null,
  roleTitle: string | null
): string | null {
  const label =
    role && role in roleLabels
      ? roleLabels[role as keyof typeof roleLabels]
      : undefined;
  if (label && roleTitle) return `${roleTitle}（${label}）`;
  return roleTitle ?? label ?? null;
}
