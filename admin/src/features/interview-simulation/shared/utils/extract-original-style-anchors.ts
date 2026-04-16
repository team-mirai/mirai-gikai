/**
 * 元インタビューから、インタビュイー LLM に文体を再現させるための
 * 「実測の文字数レンジ」と「代表サンプル発話」を抽出する純粋関数。
 *
 * ペルソナの typical_response_length enum (short/medium/long) だけでは
 * LLM が過剰に長文を生成しがちなので、元会話の実測値で直接制約をかける。
 */

export interface OriginalStyleAnchors {
  /** 実測: インタビュイーの回答文字数の平均 */
  avgResponseChars: number;
  /** 実測: 中央値 */
  medianResponseChars: number;
  /** 実測: 最長 */
  maxResponseChars: number;
  /** 実測: 最短 */
  minResponseChars: number;
  /** 文体再現用の代表サンプル（最大 3 件） */
  sampleResponses: string[];
  /** 実測: 元インタビュアーのターン数（会話の長さ目安） */
  originalInterviewerTurns: number;
  /** 実測: 元インタビュイーのターン数 */
  originalIntervieweeTurns: number;
}

/**
 * 会話ターン配列から、インタビュイー回答のスタイル指標を抽出する
 */
export function extractOriginalStyleAnchors(
  conversation: Array<{ role: "interviewer" | "interviewee"; content: string }>
): OriginalStyleAnchors {
  const intervieweeTurns = conversation
    .filter((t) => t.role === "interviewee")
    .map((t) => t.content.trim())
    .filter((c) => c.length > 0);

  const interviewerTurnsCount = conversation.filter(
    (t) => t.role === "interviewer"
  ).length;

  if (intervieweeTurns.length === 0) {
    return {
      avgResponseChars: 0,
      medianResponseChars: 0,
      maxResponseChars: 0,
      minResponseChars: 0,
      sampleResponses: [],
      originalInterviewerTurns: interviewerTurnsCount,
      originalIntervieweeTurns: 0,
    };
  }

  const sortedLengths = intervieweeTurns
    .map((t) => t.length)
    .sort((a, b) => a - b);
  const total = sortedLengths.reduce((acc, n) => acc + n, 0);
  const avg = Math.round(total / sortedLengths.length);
  const median = sortedLengths[Math.floor(sortedLengths.length / 2)];
  const max = sortedLengths[sortedLengths.length - 1];
  const min = sortedLengths[0];

  // 代表サンプル: 3 件以下ならそのまま、4 件以上なら先頭 / 中央 / 末尾を選ぶ
  const sampleResponses =
    intervieweeTurns.length <= 3
      ? [...intervieweeTurns]
      : [
          intervieweeTurns[0],
          intervieweeTurns[Math.floor(intervieweeTurns.length / 2)],
          intervieweeTurns[intervieweeTurns.length - 1],
        ];

  return {
    avgResponseChars: avg,
    medianResponseChars: median,
    maxResponseChars: max,
    minResponseChars: min,
    sampleResponses,
    originalInterviewerTurns: interviewerTurnsCount,
    originalIntervieweeTurns: intervieweeTurns.length,
  };
}
