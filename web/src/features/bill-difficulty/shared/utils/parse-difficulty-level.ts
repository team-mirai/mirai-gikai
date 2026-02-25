import {
  DEFAULT_DIFFICULTY,
  type DifficultyLevelEnum,
  VALID_DIFFICULTY_LEVELS,
} from "../types/index";

/**
 * Cookie値から難易度レベルをパースする純粋関数
 * 無効な値やundefinedの場合はデフォルト値を返す
 */
export function parseDifficultyLevel(
  cookieValue: string | undefined
): DifficultyLevelEnum {
  if (!cookieValue) {
    return DEFAULT_DIFFICULTY;
  }

  if (VALID_DIFFICULTY_LEVELS.includes(cookieValue as DifficultyLevelEnum)) {
    return cookieValue as DifficultyLevelEnum;
  }

  return DEFAULT_DIFFICULTY;
}
