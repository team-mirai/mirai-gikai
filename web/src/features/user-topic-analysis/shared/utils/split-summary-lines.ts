/**
 * トピックの説明（箇条書き・改行区切り）を1行=1要点の配列に分解する。
 *
 * description は最大3行の箇条書きを改行で区切った文字列。`<ul>` 等の箇条書きとして
 * 描画するため、改行で分割し空行を除く。先頭に紛れ込んだ箇条書き記号
 * （全角中黒「・」「･」、「•」、または「- 」スペース付きハイフン）のみを除去する。
 * `-20%` のように本文が `-` で始まる行を壊さないよう、ハイフンは後ろにスペースが続く
 * ときだけ除去する。
 */
export function splitSummaryLines(description: string): string[] {
  return description
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[・･•]\s*|-\s+)/, "").trim())
    .filter((line) => line.length > 0);
}
