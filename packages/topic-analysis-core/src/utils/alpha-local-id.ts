/**
 * トピックの一時 local_id を「英字のみ」の表記で生成する純粋関数。
 *
 * なぜ英字のみか（意見番号エコー対策）:
 * Phase3 の割当では意見を `1..20` の番号で提示するため、トピックIDに数字を使うと
 * LLM が「意見番号と同じ番号のトピックID」をエコーする誤出力（意見15→`t15`）を返し、
 * その値が偶然有効IDとして受理されて無関係な意見が混入する事故が起きる。
 * IDを英字のみにすれば数字のエコーは有効IDに一致せず null（未分類）へ倒れ、安全側に失敗する。
 *
 * index はスプレッドシートの列表記（A, B, ... Z, AA, AB, ...）に変換して prefix と結合する。
 * 例: toAlphaLocalId("t", 0) → "tA" / toAlphaLocalId("e", 26) → "eAA"
 */
export function toAlphaLocalId(prefix: string, index: number): string {
  // 0基点の index を1基点に直し、bijective base-26（列表記）で英字に変換する。
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return prefix + letters;
}
