/** 端の判定に持たせる余裕。scrollLeft は小数になるので 0 では端に着かない。 */
const EDGE_SLACK_PX = 1;

type ScrollMetrics = {
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
};

/**
 * 横スクロールの送り矢印を、どちら側に出すかを決める。
 *
 * 送れる向きにだけ出す。常に出すと、端まで見えているのにまだ続きがあるように
 * 見える。中身が収まりきっている場合はどちらも出さない。
 */
export function resolveScrollAffordance({
  scrollLeft,
  clientWidth,
  scrollWidth,
}: ScrollMetrics): { canScrollLeft: boolean; canScrollRight: boolean } {
  return {
    canScrollLeft: scrollLeft > EDGE_SLACK_PX,
    canScrollRight: scrollLeft + clientWidth < scrollWidth - EDGE_SLACK_PX,
  };
}
