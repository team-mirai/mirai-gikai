import type { QuestionAnswerCount } from "../types";

// バーの長さは全質問中の最大提示セッション数を分母にする。
// 各行の「提示数に対する回答率」ではなく、質問間の回答者数の
// ファネル（先頭の質問からどれだけ離脱したか）を比較するための正規化。
export function withAnswerBarPercents(
  counts: QuestionAnswerCount[]
): (QuestionAnswerCount & { barPercent: number })[] {
  const maxAsked = Math.max(...counts.map((c) => c.askedSessionCount), 1);
  return counts.map((c) => ({
    ...c,
    barPercent: Math.round((c.answeredSessionCount / maxAsked) * 100),
  }));
}
