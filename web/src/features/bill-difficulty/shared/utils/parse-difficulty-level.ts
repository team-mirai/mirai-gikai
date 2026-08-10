import { DEFAULT_DIFFICULTY, type DifficultyLevelEnum } from "../types/index";
import { isDifficultyLevel } from "./is-difficulty-level";

/**
 * Cookie値から難易度レベルをパースする純粋関数
 * 無効な値やundefinedの場合はデフォルト値を返す
 */
export function parseDifficultyLevel(
  cookieValue: string | undefined
): DifficultyLevelEnum {
  return isDifficultyLevel(cookieValue) ? cookieValue : DEFAULT_DIFFICULTY;
}
