/**
 * AIメッセージ中の法案名をマークダウンリンクに変換する。
 * 「法案名」（括弧付き）を優先的に探し、見つからなければ法案名のみで検索する。
 * 最初の出現のみ置換する。
 */
export function embedBillLink(
  text: string,
  billTitle: string,
  billDetailLink: string
): string {
  // 「法案名」（括弧付き）を優先的に検索
  const quotedTitle = `「${billTitle}」`;
  if (text.includes(quotedTitle)) {
    return text.replace(quotedTitle, `「[${billTitle}](${billDetailLink})」`);
  }

  // 括弧なしの法案名を検索
  if (text.includes(billTitle)) {
    return text.replace(billTitle, `[${billTitle}](${billDetailLink})`);
  }

  return text;
}
