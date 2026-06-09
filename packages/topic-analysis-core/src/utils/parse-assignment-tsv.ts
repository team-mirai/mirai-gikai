/**
 * 割当（Phase3）の TSV 出力をパースする純粋関数（§A.2）。
 * 期待形式は1行 `意見番号 \t topicID`（例: `1\tt0` / `2\tnull`）。
 * 区切りはタブ以外（`:` `→` `-`・空白）も許容する。
 *
 * - 1..batchSize の各意見番号について topicID または null を返す（未出現は null）。
 * - 範囲外の番号は無視。
 * - validTopicIds に無いID・"null"・パース不能は null（未分類）に倒す。
 */
export function parseAssignmentTsv(
  text: string,
  batchSize: number,
  validTopicIds: Set<string>
): Map<number, string | null> {
  const result = new Map<number, string | null>();
  for (let i = 1; i <= batchSize; i++) result.set(i, null);

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line.length === 0) continue;
    // 先頭の数字 ＋ 区切り（タブ/空白/: / → / -）＋ トピックトークン
    const match = line.match(/^(\d+)[\s:→-]+(\S+)/);
    if (!match) continue;

    const num = Number.parseInt(match[1], 10);
    if (num < 1 || num > batchSize) continue;

    // LLM が `t0`（バッククォート）/ "t0" / t0, のような装飾を付けることがあるため、
    // 記号類を除去して素のトークンに正規化してから照合する（不要な未分類を減らす）。
    const token = match[2].replace(/[`"'.,;]/g, "");
    if (token === "null") {
      result.set(num, null);
      continue;
    }
    result.set(num, validTopicIds.has(token) ? token : null);
  }

  return result;
}
