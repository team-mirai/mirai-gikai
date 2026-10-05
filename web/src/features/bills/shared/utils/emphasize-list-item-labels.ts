// 「- 小見出し：本文」の小見出し部分。長すぎるものは文中の全角コロンとみなして対象外にする
const LABELED_LIST_ITEM =
  /^(\s*(?:[-*+]|\d+\.)\s+)([^：\n*]{1,30})：\s*(\S.*)$/;

/**
 * 補足情報の Markdown で「- 小見出し：本文」の形の箇条を、
 * 太字の小見出しと本文の2行に分けた Markdown に変換する。
 */
export function emphasizeListItemLabels(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => {
      const match = line.match(LABELED_LIST_ITEM);
      if (!match) return line;
      const [, marker, label, body] = match;
      // 本文は箇条の内側に入るよう、マーカー幅分インデントする
      return `${marker}**${label.trim()}**\n${" ".repeat(marker.length)}${body}`;
    })
    .join("\n");
}
