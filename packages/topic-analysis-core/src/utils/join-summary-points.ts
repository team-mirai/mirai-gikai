/** 箇条書き要点の上限件数（最大3行）。 */
const MAX_POINTS = 3;

/**
 * トピック説明の箇条書き要点配列を、保存・表示用の改行区切り文字列に変換する。
 *
 * LLM に「改行区切りの文字列」を直接生成させると `\n` を入れる回と入れない回が
 * 出力ごとにばらつくため、要点を string[] で受け取りコード側で確実に `\n` 連結する。
 * 各要素を trim し空要素を除去、最大3件に丸める。表示側は `\n` で split して箇条書き描画する。
 */
export function joinSummaryPoints(points: string[]): string {
  return points
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .slice(0, MAX_POINTS)
    .join("\n");
}
