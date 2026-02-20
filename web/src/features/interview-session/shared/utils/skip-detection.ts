const END_PATTERNS = ["終わり", "終了", "以上です", "もう大丈夫"];

const SKIP_PATTERNS = [
  "次のテーマに進みたいです",
  "次のテーマに進みたい",
  "スキップ",
  "次の質問",
];

/**
 * 終了意思を含むメッセージかどうかを判定する
 */
export function isEndMessage(content: string): boolean {
  return END_PATTERNS.some((pattern) => content.includes(pattern));
}

/**
 * スキップリクエストかどうかを判定する
 * UIの「スキップする」ボタンは "次のテーマに進みたいです" を送信する
 * 終了意思を含むメッセージはスキップとして扱わない
 */
export function isSkipMessage(content: string): boolean {
  if (isEndMessage(content)) {
    return false;
  }
  return SKIP_PATTERNS.some((pattern) => content.includes(pattern));
}
