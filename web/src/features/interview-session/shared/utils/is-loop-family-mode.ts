import type { InterviewMode } from "@mirai-gikai/shared/interview-prompts/types";

/**
 * loop / targeted モードを「同じ系列」として扱うための判定関数。
 *
 * loop と targeted はどちらも1問ずつ深掘りするモードで、進捗バー表示・
 * 評価ウィジェット表示など、UI 上の挙動を揃えたい場面で利用する。
 * bulk モードは進捗の見え方が大きく異なるためこの集合からは除外する。
 */
export function isLoopFamilyMode(
  mode: InterviewMode | undefined | null
): boolean {
  return mode === "loop" || mode === "targeted";
}
