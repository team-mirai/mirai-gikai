/**
 * 要素を指定行数に振り分ける。
 *
 * i 番目を i % rowCount 行目に置くので、列ごとに上から下へ詰まる。
 * 横スクロールさせたときに左から順に読める並びになる。
 *
 * grid で2行に流すと列幅が最長要素に揃い、短いチップの右に空白が残る。
 * 行ごとの独立した並びにするために、ここで配列を分けておく。
 */
export function splitIntoRows<T>(items: readonly T[], rowCount: number): T[][] {
  if (rowCount < 1) return [];

  const rows: T[][] = Array.from({ length: rowCount }, () => []);
  items.forEach((item, index) => {
    rows[index % rowCount].push(item);
  });

  return rows;
}
