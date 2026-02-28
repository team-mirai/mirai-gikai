/**
 * estimated_duration（分）を表示用テキストにフォーマットする。
 * - 値がある場合: "約5分〜"
 * - nullの場合: null を返す（表示しない判断を呼び出し側に委ねる）
 */
export function formatEstimatedDuration(
  estimatedDuration: number | null
): string | null {
  if (estimatedDuration === null) {
    return null;
  }
  return `約${estimatedDuration}分〜`;
}
