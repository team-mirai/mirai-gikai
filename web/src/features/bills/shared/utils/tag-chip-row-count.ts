/**
 * 1行に収める上限。これを超えたら2行に詰めて横スクロールさせる。
 *
 * 実測の幅ではなく件数で決めている。サーバー側では文字幅が分からないため、
 * ここはあくまで推定。短いチップが7個なら不要に2行になり、長いラベルが
 * 6個なら横に長い1行になる。
 */
const MAX_CHIPS_IN_SINGLE_ROW = 6;

/**
 * カテゴリチップを何行に並べるかを決める。
 *
 * 少ないときに2行へ割ると、横に余白があるのに縦に並んでしまう。本番の18件は
 * 2行、絞り込みで数個に減ったときは1行になる。
 */
export function tagChipRowCount(chipCount: number): number {
  return chipCount > MAX_CHIPS_IN_SINGLE_ROW ? 2 : 1;
}
